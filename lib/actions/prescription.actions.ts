"use server"

import { revalidatePath } from "next/cache"
import { logClinicalAction } from "@/lib/audit"
import { requireRole } from "@/lib/auth/require-role"
import { MedicalRecordStatus } from "@/lib/generated/prisma"
import { prisma } from "@/lib/prisma"

type PrescriptionItemInput = {
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instruction?: string
}

function clean(value: string) {
  return value.trim()
}

function revalidatePrescriptionPaths() {
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/doctor/medical-records")
  revalidatePath("/patient")
  revalidatePath("/patient/health-records")
}

export async function createPrescription(params: {
  medicalRecordId: string
  note?: string
  items: PrescriptionItemInput[]
}) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  const doctorId = profile.doctorProfile?.id
  if (profile.role === "DOCTOR" && !doctorId) throw new Error("DOCTOR_PROFILE_REQUIRED")

  const sanitizedItems = params.items
    .map((item) => ({
      medicationName: clean(item.medicationName),
      dosage: clean(item.dosage),
      frequency: clean(item.frequency),
      duration: clean(item.duration),
      instruction: item.instruction?.trim() ? item.instruction.trim() : null,
    }))
    .filter((item) => item.medicationName && item.dosage && item.frequency && item.duration)

  if (sanitizedItems.length === 0) throw new Error("PRESCRIPTION_ITEM_REQUIRED")

  const prescription = await prisma.$transaction(async (tx) => {
    const record = await tx.medicalRecord.findUnique({
      where: { id: params.medicalRecordId },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        encounterId: true,
        status: true,
        appointment: { select: { doctorId: true } },
      },
    })
    if (!record) throw new Error("MEDICAL_RECORD_NOT_FOUND")
    if (record.status === MedicalRecordStatus.FINALIZED) {
      throw new Error("MEDICAL_RECORD_FINALIZED: Hồ sơ đã chốt, không thể thêm đơn thuốc")
    }
    const ownerDoctorId = record.doctorId ?? record.appointment.doctorId
    if (profile.role === "DOCTOR" && ownerDoctorId !== doctorId) {
      throw new Error("FORBIDDEN: Không phải hồ sơ của bác sĩ này")
    }
    if (!record.doctorId) {
      await tx.medicalRecord.update({
        where: { id: record.id },
        data: { doctorId: ownerDoctorId },
      })
    }

    const created = await tx.prescription.create({
      data: {
        medicalRecordId: record.id,
        patientId: record.patientId,
        doctorId: ownerDoctorId,
        encounterId: record.encounterId,
        note: params.note?.trim() ? params.note.trim() : null,
        items: {
          create: sanitizedItems,
        },
      },
      include: { items: true },
    })

    await logClinicalAction(tx, {
      actorId: profile.id,
      actorRole: profile.role,
      action: "PRESCRIPTION_CREATED",
      targetTable: "prescriptions",
      targetId: created.id,
      newValue: {
        medicalRecordId: record.id,
        itemCount: created.items.length,
      },
    })

    return created
  })

  revalidatePrescriptionPaths()
  return prescription
}

export async function deletePrescription(prescriptionId: string) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  const doctorId = profile.doctorProfile?.id

  const deleted = await prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        medicalRecord: { select: { status: true, doctorId: true } },
        items: true,
      },
    })
    if (!prescription) throw new Error("PRESCRIPTION_NOT_FOUND")
    if (prescription.medicalRecord.status === MedicalRecordStatus.FINALIZED) {
      throw new Error("MEDICAL_RECORD_FINALIZED: Hồ sơ đã chốt, không thể xóa đơn thuốc")
    }
    if (profile.role === "DOCTOR" && prescription.medicalRecord.doctorId !== doctorId) {
      throw new Error("FORBIDDEN: Không phải hồ sơ của bác sĩ này")
    }

    const result = await tx.prescription.delete({ where: { id: prescription.id } })
    await logClinicalAction(tx, {
      actorId: profile.id,
      actorRole: profile.role,
      action: "MEDICAL_RECORD_DRAFT_SAVED",
      targetTable: "prescriptions",
      targetId: prescription.id,
      oldValue: { itemCount: prescription.items.length },
      newValue: { deleted: true },
    })
    return result
  })

  revalidatePrescriptionPaths()
  return deleted
}
