"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/require-role"
import { logClinicalAction } from "@/lib/audit"
import {
  AppointmentStatus,
  EncounterStatus,
  MedicalRecordStatus,
  type Role,
} from "@/lib/generated/prisma"
import { notifyAppointmentCompleted } from "@/services/notification.service"

function revalidateEncounterPaths() {
  revalidatePath("/staff")
  revalidatePath("/staff/appointments")
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/doctor/medical-records")
  revalidatePath("/patient")
  revalidatePath("/patient/health-records")
}

async function createEncounterForPresentPatient({
  appointmentId,
  actorId,
  actorRole,
  doctorId,
}: {
  appointmentId: string
  actorId: string
  actorRole: Role
  doctorId?: string
}) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { medicalRecord: true },
    })
    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND")
    if (doctorId && appointment.doctorId !== doctorId) {
      throw new Error("FORBIDDEN: Không phải ca của bác sĩ này")
    }
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new Error(
        `INVALID_STATUS: Chỉ check-in lịch đã xác nhận, hiện tại: ${appointment.status}`,
      )
    }

    await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CHECKED_IN },
    })

    const encounter = await tx.encounter.upsert({
      where: { appointmentId: appointment.id },
      update: {
        status: EncounterStatus.IN_PROGRESS,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      },
      create: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      },
    })

    const medicalRecord = await tx.medicalRecord.upsert({
      where: { appointmentId: appointment.id },
      update: {
        encounterId: encounter.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        chiefComplaint: appointment.visitReason ?? appointment.notes ?? appointment.medicalRecord?.chiefComplaint,
        status: MedicalRecordStatus.DRAFT,
      },
      create: {
        appointmentId: appointment.id,
        encounterId: encounter.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        guestSnapshotName: appointment.guestName,
        guestSnapshotPhone: appointment.guestPhone,
        chiefComplaint: appointment.visitReason,
        status: MedicalRecordStatus.DRAFT,
      },
    })

    await logClinicalAction(tx, {
      actorId,
      actorRole,
      action: "ENCOUNTER_CREATED",
      targetTable: "encounters",
      targetId: encounter.id,
      newValue: {
        appointmentId: appointment.id,
        medicalRecordId: medicalRecord.id,
        status: EncounterStatus.IN_PROGRESS,
      },
    })

    return { encounter, medicalRecord }
  })
}

export async function checkInPatient(appointmentId: string) {
  const { profile } = await requireRole(["STAFF", "ADMIN"])

  const result = await createEncounterForPresentPatient({
    appointmentId,
    actorId: profile.id,
    actorRole: profile.role,
  })

  revalidateEncounterPaths()
  return result
}

export async function doctorConfirmPatientPresent(appointmentId: string) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  const doctorId = profile.role === "DOCTOR" ? profile.doctorProfile?.id : undefined
  if (profile.role === "DOCTOR" && !doctorId) throw new Error("DOCTOR_PROFILE_REQUIRED")

  const result = await createEncounterForPresentPatient({
    appointmentId,
    actorId: profile.id,
    actorRole: profile.role,
    doctorId,
  })

  revalidateEncounterPaths()
  return result
}

export async function finalizeRecord(medicalRecordId: string) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.medicalRecord.findUnique({
      where: { id: medicalRecordId },
      include: { appointment: true, encounter: true },
    })
    if (!record) throw new Error("MEDICAL_RECORD_NOT_FOUND")
    if (!record.encounterId) throw new Error("ENCOUNTER_REQUIRED")
    if (!record.diagnosis?.trim()) throw new Error("DIAGNOSIS_REQUIRED")
    if (!record.chiefComplaint?.trim()) throw new Error("CHIEF_COMPLAINT_REQUIRED")
    if (record.status === MedicalRecordStatus.FINALIZED) return record
    const ownerDoctorId = record.doctorId ?? record.appointment.doctorId
    if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== ownerDoctorId) {
      throw new Error("FORBIDDEN: Không phải hồ sơ của bác sĩ này")
    }

    const updated = await tx.medicalRecord.update({
      where: { id: record.id },
      data: { doctorId: ownerDoctorId, status: MedicalRecordStatus.FINALIZED },
    })

    await logClinicalAction(tx, {
      actorId: profile.id,
      actorRole: profile.role,
      action: "MEDICAL_RECORD_FINALIZED",
      targetTable: "medical_records",
      targetId: record.id,
      oldValue: { status: record.status },
      newValue: { status: updated.status },
    })

    return updated
  })

  revalidateEncounterPaths()
  return result
}

export async function completeEncounter(encounterId: string) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])

  const result = await prisma.$transaction(async (tx) => {
    const encounter = await tx.encounter.findUnique({
      where: { id: encounterId },
      include: { medicalRecord: true, appointment: true },
    })
    if (!encounter) throw new Error("ENCOUNTER_NOT_FOUND")
    if (encounter.status !== EncounterStatus.IN_PROGRESS) {
      throw new Error(`INVALID_STATUS: Encounter hiện tại: ${encounter.status}`)
    }
    if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== encounter.doctorId) {
      throw new Error("FORBIDDEN: Không phải encounter của bác sĩ này")
    }
    if (encounter.medicalRecord?.status !== MedicalRecordStatus.FINALIZED) {
      throw new Error("MEDICAL_RECORD_NOT_FINALIZED")
    }

    const updatedEncounter = await tx.encounter.update({
      where: { id: encounter.id },
      data: { status: EncounterStatus.COMPLETED, endedAt: new Date() },
    })

    await tx.appointment.update({
      where: { id: encounter.appointmentId },
      data: { status: AppointmentStatus.COMPLETED },
    })

    await logClinicalAction(tx, {
      actorId: profile.id,
      actorRole: profile.role,
      action: "ENCOUNTER_COMPLETED",
      targetTable: "encounters",
      targetId: encounter.id,
      oldValue: { status: encounter.status },
      newValue: { status: updatedEncounter.status },
    })

    return updatedEncounter
  })

  await notifyAppointmentCompleted(result.appointmentId)
  revalidateEncounterPaths()
  return result
}
