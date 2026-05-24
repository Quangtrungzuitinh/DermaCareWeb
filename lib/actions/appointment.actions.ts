"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { appointmentService } from "@/services/patient.service"
import { requireRole } from "@/lib/auth/require-role"
import { AppointmentStatus, ConfirmationSource, ConsentType } from "@/lib/generated/prisma"
import { confirmPayment } from "@/lib/actions/payment.actions"
import {
  notifyAppointmentCancelled,
  notifyAppointmentCreated,
} from "@/services/notification.service"
import { revalidatePath } from "next/cache"
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants"

interface CreateAppointmentParams {
  doctorId: string
  appointmentDate: Date
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  visitReason?: string
  birthYear?: number
  province?: string
  district?: string
  payAtClinic?: boolean
  notes?: string
  consentDataStorage?: boolean
  aiPredictedCondition?: string
  aiConfidenceScore?: number
}

export async function createAppointment(params: CreateAppointmentParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let patientId: string | null = null

  if (user) {
    const profile = await prisma.profile.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true, consentDataStorage: true },
    })
    patientId = profile?.id ?? null

    const hasConsent = profile?.consentDataStorage || params.consentDataStorage
    if (!hasConsent) {
      throw new Error('CONSENT_REQUIRED: Bạn cần đồng ý lưu trữ hồ sơ y tế')
    }
    if (params.consentDataStorage && patientId) {
      await prisma.$transaction([
        prisma.profile.update({
          where: { id: patientId },
          data: {
            consentDataStorage: true,
            consentGivenAt: profile?.consentDataStorage ? undefined : new Date(),
          },
        }),
        prisma.consent.upsert({
          where: { patientId_type: { patientId, type: ConsentType.STORE_MEDICAL_RECORD } },
          update: { granted: true, grantedAt: new Date(), revokedAt: null },
          create: {
            patientId,
            type: ConsentType.STORE_MEDICAL_RECORD,
            granted: true,
            grantedAt: new Date(),
          },
        }),
        prisma.consent.upsert({
          where: { patientId_type: { patientId, type: ConsentType.STORE_SKIN_IMAGE } },
          update: { granted: true, grantedAt: new Date(), revokedAt: null },
          create: {
            patientId,
            type: ConsentType.STORE_SKIN_IMAGE,
            granted: true,
            grantedAt: new Date(),
          },
        }),
      ])
    }
  } else {
    if (!params.consentDataStorage) {
      throw new Error('CONSENT_REQUIRED: Bạn cần đồng ý lưu trữ hồ sơ y tế')
    }
  }

  if (!patientId && (!params.guestName || !params.guestPhone)) {
    throw new Error("GUEST_MISSING_INFO: Tên và SĐT là bắt buộc với khách vãng lai")
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        doctorId: params.doctorId,
        appointmentDate: params.appointmentDate,
        patientId,
        guestName: params.guestName ?? null,
        guestPhone: params.guestPhone ?? null,
        guestEmail: params.guestEmail ?? null,
        visitReason: params.visitReason ?? null,
        birthYear: params.birthYear ?? null,
        province: params.province ?? null,
        district: params.district ?? null,
        payAtClinic: params.payAtClinic ?? false,
        notes: params.notes ?? null,
        aiPredictedCondition: params.aiPredictedCondition ?? null,
        aiConfidenceScore: params.aiConfidenceScore ?? null,
        baseFee: APPOINTMENT_DEPOSIT_AMOUNT,
      },
    })
    await notifyAppointmentCreated(appointment.id, "WEBSITE")
    return { success: true, appointment }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      throw new Error("SLOT_TAKEN: Khung giờ này đã có người đặt")
    }

    throw error
  }
}

export async function getAppointmentStatus(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true },
  })

  return appointment ? { status: appointment.status } : null
}

export async function cancelMyAppointment(appointmentId: string) {
  try {
    const appointment = await appointmentService.cancelAppointment(appointmentId)
    revalidatePath("/patient/appointments")
    revalidatePath("/patient/dashboard")
    return { success: true, appointment }
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR"
    return { success: false, error: message }
  }
}

export async function createStaffAppointment(
  params: CreateAppointmentParams & {
    patientId?: string
    paidNow?: boolean
  },
) {
  const { profile } = await requireRole(["STAFF", "ADMIN"])

  if (!params.patientId && (!params.guestName || !params.guestPhone)) {
    throw new Error("GUEST_MISSING_INFO")
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        doctorId: params.doctorId,
        appointmentDate: params.appointmentDate,
        patientId: params.patientId ?? null,
        guestName: params.patientId ? null : (params.guestName ?? null),
        guestPhone: params.patientId ? null : (params.guestPhone ?? null),
        guestEmail: params.patientId ? null : (params.guestEmail ?? null),
        visitReason: params.visitReason ?? null,
        birthYear: params.birthYear ?? null,
        province: params.province ?? null,
        district: params.district ?? null,
        payAtClinic: params.payAtClinic ?? false,
        notes: params.notes ?? null,
        baseFee: APPOINTMENT_DEPOSIT_AMOUNT,
      },
    })
    await notifyAppointmentCreated(appointment.id, "STAFF")

    if (params.paidNow) {
      await confirmPayment({
        appointmentId: appointment.id,
        confirmedById: profile.id,
        amount: appointment.baseFee,
        source: ConfirmationSource.MANUAL,
      })
    }

    revalidatePath("/staff")
    revalidatePath("/staff/appointments")
    revalidatePath("/admin")
    return { success: true, appointment }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      throw new Error("SLOT_TAKEN")
    }
    throw error
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  await requireRole(["STAFF", "ADMIN"])
  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  })
  revalidatePath("/staff")
  revalidatePath("/staff/appointments")
  revalidatePath("/admin")
  return { success: true, appointment }
}

export async function linkGuestAppointmentToPatient(appointmentId: string, identifier: string) {
  await requireRole(["STAFF", "ADMIN"])
  const value = identifier.trim()
  if (!value) throw new Error("IDENTIFIER_REQUIRED")

  const normalizedEmail = value.includes("@") ? value.toLowerCase() : null
  const normalizedPhone = value.replace(/\s+/g, "")

  const patient = await prisma.profile.findFirst({
    where: {
      role: "PATIENT",
      OR: [
        ...(normalizedEmail ? [{ email: { equals: normalizedEmail, mode: "insensitive" as const } }] : []),
        { phone: value },
        { phone: normalizedPhone },
      ],
    },
    select: { id: true, fullName: true, email: true, phone: true },
  })
  if (!patient) throw new Error("PATIENT_NOT_FOUND")

  await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { medicalRecord: true, encounter: true, payment: true },
    })
    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND")
    if (appointment.patientId) throw new Error("APPOINTMENT_ALREADY_LINKED")

    await tx.appointment.update({
      where: { id: appointment.id },
      data: { patientId: patient.id },
    })

    if (appointment.payment) {
      await tx.payment.update({
        where: { appointmentId: appointment.id },
        data: { payerId: patient.id },
      })
    }

    if (appointment.encounter) {
      await tx.encounter.update({
        where: { id: appointment.encounter.id },
        data: { patientId: patient.id },
      })
    }

    if (appointment.medicalRecord) {
      await tx.medicalRecord.update({
        where: { id: appointment.medicalRecord.id },
        data: { patientId: patient.id },
      })
      await tx.prescription.updateMany({
        where: { medicalRecordId: appointment.medicalRecord.id },
        data: { patientId: patient.id },
      })
      await tx.condition.updateMany({
        where: { medicalRecordId: appointment.medicalRecord.id },
        data: { patientId: patient.id },
      })
      await tx.treatmentPlan.updateMany({
        where: { medicalRecordId: appointment.medicalRecord.id },
        data: { patientId: patient.id },
      })
    }

    if (appointment.encounter) {
      await tx.followUpNote.updateMany({
        where: { encounterId: appointment.encounter.id },
        data: { patientId: patient.id },
      })
    }
  })

  revalidatePath("/staff")
  revalidatePath("/staff/appointments")
  revalidatePath("/admin")
  revalidatePath("/admin/appointments")
  revalidatePath("/doctor")
  revalidatePath("/doctor/medical-records")
  revalidatePath("/patient/health-records")
  return { success: true, patient }
}

export async function cancelAppointment(appointmentId: string, reason: string) {
  await requireRole(["STAFF", "ADMIN"])
  const trimmed = reason.trim()
  if (!trimmed) throw new Error("CANCEL_REASON_REQUIRED")
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CANCELLED },
  })
  revalidatePath("/staff")
  revalidatePath("/staff/appointments")
  revalidatePath("/admin")
  await notifyAppointmentCancelled(appointmentId, trimmed)
  return { success: true }
}
