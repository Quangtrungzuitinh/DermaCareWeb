"use server"

import { ConsentType } from "@/lib/generated/prisma"
import { requireRole } from "@/lib/auth/require-role"
import { upsertConsent } from "@/lib/consent"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updatePatientConsent(type: ConsentType, granted: boolean) {
  const { profile } = await requireRole(["PATIENT"])
  return upsertConsent({ patientId: profile.id, type, granted })
}

export async function recordAppointmentImageStorageConsent(appointmentId: string) {
  const { profile } = await requireRole(["DOCTOR", "STAFF", "ADMIN"])
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      patientId: true,
      doctorId: true,
    },
  })

  if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND")
  if (!appointment.patientId) throw new Error("PATIENT_LINK_REQUIRED")
  if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== appointment.doctorId) {
    throw new Error("FORBIDDEN")
  }

  const now = new Date()
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: appointment.patientId },
      data: {
        consentDataStorage: true,
        consentGivenAt: now,
      },
    }),
    prisma.consent.upsert({
      where: {
        patientId_type: {
          patientId: appointment.patientId,
          type: ConsentType.STORE_MEDICAL_RECORD,
        },
      },
      update: { granted: true, grantedAt: now, revokedAt: null },
      create: {
        patientId: appointment.patientId,
        type: ConsentType.STORE_MEDICAL_RECORD,
        granted: true,
        grantedAt: now,
      },
    }),
    prisma.consent.upsert({
      where: {
        patientId_type: {
          patientId: appointment.patientId,
          type: ConsentType.STORE_SKIN_IMAGE,
        },
      },
      update: { granted: true, grantedAt: now, revokedAt: null },
      create: {
        patientId: appointment.patientId,
        type: ConsentType.STORE_SKIN_IMAGE,
        granted: true,
        grantedAt: now,
      },
    }),
  ])

  revalidatePath("/doctor/medical-records")
  revalidatePath("/doctor/appointments")
  revalidatePath("/staff/appointments")
  return { success: true }
}
