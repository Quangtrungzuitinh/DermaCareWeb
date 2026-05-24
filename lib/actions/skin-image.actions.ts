"use server"

import { revalidatePath } from "next/cache"
import { logClinicalAction } from "@/lib/audit"
import {
  getDriveParentFolderId,
  getOrCreateFolder,
  trashDriveFile,
  uploadFileToDrive,
} from "@/lib/google-drive"
import { requireRole } from "@/lib/auth/require-role"
import { requireConsent } from "@/lib/consent"
import { ConsentType } from "@/lib/generated/prisma"
import { prisma } from "@/lib/prisma"
import { analyzeSkinImage, SKIN_ANALYSIS_MODEL_VERSION } from "@/lib/skin-analysis"

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

function revalidateSkinImagePaths() {
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/doctor/medical-records")
  revalidatePath("/patient")
  revalidatePath("/patient/health-records")
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)
}

export async function uploadSkinImage(formData: FormData) {
  const { profile } = await requireRole(["DOCTOR", "STAFF", "ADMIN"])
  const file = formData.get("file")
  if (!(file instanceof File)) throw new Error("FILE_REQUIRED")
  if (!ALLOWED_MIME_TYPES.has(file.type)) throw new Error("INVALID_FILE_TYPE")
  if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("FILE_TOO_LARGE")

  const medicalRecordId = getRequiredString(formData, "medicalRecordId")
  const encounterId = getRequiredString(formData, "encounterId")
  const bodyArea = getRequiredString(formData, "bodyArea")
  const note = getRequiredString(formData, "note")

  if (!medicalRecordId && !encounterId) throw new Error("MEDICAL_RECORD_OR_ENCOUNTER_REQUIRED")

  const context = await prisma.medicalRecord.findFirst({
    where: medicalRecordId ? { id: medicalRecordId } : { encounterId },
    include: {
      patient: { select: { id: true, consentDataStorage: true } },
      encounter: true,
      appointment: { select: { doctorId: true } },
    },
  })
  if (!context) throw new Error("MEDICAL_RECORD_NOT_FOUND")
  if (!context.patientId || !context.patient) {
    throw new Error("PATIENT_LINK_REQUIRED: Cần nối khách vãng lai với tài khoản bệnh nhân trước khi lưu ảnh da")
  }
  await requireConsent(context.patientId, ConsentType.STORE_SKIN_IMAGE)
  const ownerDoctorId = context.doctorId ?? context.appointment.doctorId
  if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== ownerDoctorId) {
    throw new Error("FORBIDDEN: Không phải hồ sơ của bác sĩ này")
  }
  if (!context.doctorId) {
    await prisma.medicalRecord.update({
      where: { id: context.id },
      data: { doctorId: ownerDoctorId },
    })
  }

  const parentFolderId = getDriveParentFolderId()
  const patientFolderId = await getOrCreateFolder({ name: context.patientId, parentId: parentFolderId })
  const encounterFolderId = await getOrCreateFolder({
    name: context.encounterId ?? "unlinked",
    parentId: patientFolderId,
  })
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${Date.now()}_${safeFileName(file.name)}`
  const uploaded = await uploadFileToDrive({
    buffer,
    fileName,
    mimeType: file.type,
    parentFolderId: encounterFolderId,
  })

  const skinImage = await prisma.$transaction(async (tx) => {
    const created = await tx.skinImage.create({
      data: {
        patientId: context.patientId!,
        encounterId: context.encounterId,
        medicalRecordId: context.id,
        driveFileId: uploaded.fileId,
        fileName,
        mimeType: file.type,
        fileSizeBytes: file.size,
        thumbnailUrl: uploaded.thumbnailUrl,
        bodyArea,
        uploadedBy: profile.id,
        note,
      },
    })

    await logClinicalAction(tx, {
      actorId: profile.id,
      actorRole: profile.role,
      action: "SKIN_IMAGE_UPLOADED",
      targetTable: "skin_images",
      targetId: created.id,
      newValue: {
        patientId: context.patientId,
        encounterId: context.encounterId,
        medicalRecordId: context.id,
        fileName,
        mimeType: file.type,
      },
    })

    return created
  })

  revalidateSkinImagePaths()
  return { success: true, skinImageId: skinImage.id }
}

export async function deleteSkinImage(skinImageId: string) {
  const { profile } = await requireRole(["DOCTOR", "STAFF", "ADMIN"])

  const skinImage = await prisma.skinImage.findUnique({
    where: { id: skinImageId },
    include: {
      medicalRecord: {
        select: {
          doctorId: true,
          appointment: { select: { doctorId: true } },
        },
      },
    },
  })
  if (!skinImage || skinImage.deletedAt) throw new Error("SKIN_IMAGE_NOT_FOUND")
  const ownerDoctorId =
    skinImage.medicalRecord?.doctorId ?? skinImage.medicalRecord?.appointment.doctorId
  if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== ownerDoctorId) {
    throw new Error("FORBIDDEN: Không phải ảnh của hồ sơ bác sĩ này")
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const updated = await tx.skinImage.update({
      where: { id: skinImage.id },
      data: { deletedAt: new Date(), deletedBy: profile.id },
    })

    await logClinicalAction(tx, {
      actorId: profile.id,
      actorRole: profile.role,
      action: "SKIN_IMAGE_DELETED",
      targetTable: "skin_images",
      targetId: skinImage.id,
      oldValue: { deletedAt: skinImage.deletedAt },
      newValue: { deletedAt: updated.deletedAt?.toISOString() ?? null },
    })

    return updated
  })

  try {
    await trashDriveFile(skinImage.driveFileId)
  } catch (error) {
    console.error("Failed to trash Google Drive file", error)
  }

  revalidateSkinImagePaths()
  return { success: true, skinImageId: deleted.id }
}

export async function triggerSkinAnalysis(skinImageId: string) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  const skinImage = await prisma.skinImage.findFirst({
    where: { id: skinImageId, deletedAt: null },
    include: {
      medicalRecord: {
        select: {
          doctorId: true,
          diagnosis: true,
          appointment: { select: { doctorId: true } },
        },
      },
      patient: { select: { id: true } },
    },
  })
  if (!skinImage) throw new Error("SKIN_IMAGE_NOT_FOUND")
  const ownerDoctorId =
    skinImage.medicalRecord?.doctorId ?? skinImage.medicalRecord?.appointment.doctorId
  if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== ownerDoctorId) {
    throw new Error("FORBIDDEN")
  }
  await requireConsent(skinImage.patientId, ConsentType.USE_IMAGE_FOR_AI_ANALYSIS)

  let scores: Awaited<ReturnType<typeof analyzeSkinImage>> | null = null
  let errorMsg: string | null = null
  try {
    scores = await analyzeSkinImage({
      driveFileId: skinImage.driveFileId,
      mimeType: skinImage.mimeType,
      conditionHint: skinImage.medicalRecord?.diagnosis,
    })
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : "UNKNOWN_ERROR"
  }

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.skinAnalysisResult.upsert({
      where: { skinImageId: skinImage.id },
      update: {
        acneSeverity: scores?.acneSeverity ?? null,
        rednessScore: scores?.rednessScore ?? null,
        pigmentScore: scores?.pigmentScore ?? null,
        oilinessScore: scores?.oilinessScore ?? null,
        rawScores: scores ?? undefined,
        conditionType: scores?.conditionType ?? "unknown",
        confidence: scores?.confidence ?? null,
        modelVersion: scores?.modelVersion ?? SKIN_ANALYSIS_MODEL_VERSION,
        error: errorMsg,
      },
      create: {
        skinImageId: skinImage.id,
        patientId: skinImage.patientId,
        encounterId: skinImage.encounterId,
        acneSeverity: scores?.acneSeverity ?? null,
        rednessScore: scores?.rednessScore ?? null,
        pigmentScore: scores?.pigmentScore ?? null,
        oilinessScore: scores?.oilinessScore ?? null,
        rawScores: scores ?? undefined,
        conditionType: scores?.conditionType ?? "unknown",
        confidence: scores?.confidence ?? null,
        modelVersion: scores?.modelVersion ?? SKIN_ANALYSIS_MODEL_VERSION,
        error: errorMsg,
      },
    })

    await tx.skinImage.update({ where: { id: skinImage.id }, data: { aiAnalysisId: created.id } })
    await logClinicalAction(tx, {
      actorId: profile.id,
      actorRole: profile.role,
      action: "SKIN_ANALYSIS_TRIGGERED",
      targetTable: "skin_analysis_results",
      targetId: created.id,
      newValue: { success: !errorMsg, error: errorMsg },
    })
    return created
  })

  revalidateSkinImagePaths()
  return { success: !errorMsg, resultId: result.id, error: errorMsg }
}

export async function confirmAnalysis(params: {
  resultId: string
  overrideScore?: number | null
  doctorNote?: string
}) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  const result = await prisma.skinAnalysisResult.findUnique({
    where: { id: params.resultId },
    include: {
      skinImage: {
        include: {
          medicalRecord: {
            select: {
              doctorId: true,
              appointment: { select: { doctorId: true } },
            },
          },
        },
      },
    },
  })
  if (!result) throw new Error("SKIN_ANALYSIS_NOT_FOUND")
  const ownerDoctorId =
    result.skinImage.medicalRecord?.doctorId ??
    result.skinImage.medicalRecord?.appointment.doctorId
  if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== ownerDoctorId) {
    throw new Error("FORBIDDEN")
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.skinAnalysisResult.update({
      where: { id: result.id },
      data: {
        doctorConfirmed: true,
        doctorOverrideScore: params.overrideScore ?? null,
        doctorNote: params.doctorNote?.trim() || null,
        confirmedAt: new Date(),
        confirmedById: profile.id,
      },
    })
    await logClinicalAction(tx, {
      actorId: profile.id,
      actorRole: profile.role,
      action: "SKIN_ANALYSIS_CONFIRMED",
      targetTable: "skin_analysis_results",
      targetId: row.id,
      newValue: { doctorOverrideScore: row.doctorOverrideScore },
    })
    return row
  })

  revalidateSkinImagePaths()
  return updated
}
