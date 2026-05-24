"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { notifyAppointmentCompleted } from "@/services/notification.service"
import { revalidatePath } from "next/cache"
import { AppointmentStatus, MedicalRecordStatus } from "@/lib/generated/prisma"

async function getDoctorProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("UNAUTHORIZED")

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    include: { doctorProfile: true },
  })
  if (!profile || profile.role !== "DOCTOR" || !profile.doctorProfile) {
    throw new Error("FORBIDDEN: Chỉ bác sĩ được thao tác y lệnh")
  }
  return profile
}

async function assertTreatmentEditable(medicalRecordId: string, doctorId: string) {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: medicalRecordId },
    include: {
      appointment: {
        select: { doctorId: true, status: true, appointmentDate: true },
      },
    },
  })
  if (!record) throw new Error("MEDICAL_RECORD_NOT_FOUND")

  if (record.appointment.doctorId !== doctorId) {
    throw new Error("FORBIDDEN: Không phải ca của bác sĩ này")
  }
  if (record.status === MedicalRecordStatus.FINALIZED) {
    throw new Error("MEDICAL_RECORD_FINALIZED: Hồ sơ đã chốt, chỉ được sửa qua amendment")
  }
  if (record.appointment.status === AppointmentStatus.COMPLETED) {
    throw new Error("TREATMENT_LOCKED: Ca khám đã hoàn thành, không thể sửa y lệnh")
  }
  if (record.appointment.status !== AppointmentStatus.CHECKED_IN) {
    throw new Error(
      `PATIENT_NOT_PRESENT: Bác sĩ cần xác nhận bệnh nhân đã có mặt trước khi ghi hồ sơ. Hiện tại: ${record.appointment.status}`,
    )
  }

  return record
}

function revalidateClinicalPaths() {
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/doctor/medical-records")
  revalidatePath("/staff")
  revalidatePath("/patient")
}

export async function addTreatment(
  medicalRecordId: string,
  serviceId: string,
  quantity: number,
  notes?: string,
) {
  const profile = await getDoctorProfile()
  await assertTreatmentEditable(medicalRecordId, profile.doctorProfile!.id)

  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error("INVALID_QUANTITY")
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId, isActive: true },
  })
  if (!service) throw new Error("SERVICE_NOT_FOUND_OR_INACTIVE")

  const treatment = await prisma.treatment.create({
    data: {
      medicalRecordId,
      serviceId,
      quantity,
      priceAtTime: service.price,
      notes: notes?.trim() ? notes.trim() : null,
    },
  })

  revalidateClinicalPaths()
  return treatment
}

export async function updateTreatment(
  treatmentId: string,
  data: { quantity?: number; notes?: string },
) {
  const profile = await getDoctorProfile()

  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    select: { medicalRecordId: true },
  })
  if (!treatment) throw new Error("TREATMENT_NOT_FOUND")

  await assertTreatmentEditable(treatment.medicalRecordId, profile.doctorProfile!.id)

  if (data.quantity !== undefined && (!Number.isSafeInteger(data.quantity) || data.quantity <= 0)) {
    throw new Error("INVALID_QUANTITY")
  }

  const updated = await prisma.treatment.update({
    where: { id: treatmentId },
    data: {
      quantity: data.quantity,
      notes: data.notes?.trim() ? data.notes.trim() : data.notes === "" ? null : undefined,
    },
  })

  revalidateClinicalPaths()
  return updated
}

export async function deleteTreatment(treatmentId: string) {
  const profile = await getDoctorProfile()

  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    select: { medicalRecordId: true },
  })
  if (!treatment) throw new Error("TREATMENT_NOT_FOUND")

  await assertTreatmentEditable(treatment.medicalRecordId, profile.doctorProfile!.id)

  const deleted = await prisma.treatment.delete({ where: { id: treatmentId } })
  revalidateClinicalPaths()
  return deleted
}

export async function completeAppointment(appointmentId: string) {
  const profile = await getDoctorProfile()

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      doctorId: true,
      status: true,
      appointmentDate: true,
      encounter: { select: { id: true } },
    },
  })
  if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND")

  if (appointment.doctorId !== profile.doctorProfile!.id) {
    throw new Error("FORBIDDEN: Không phải ca của bác sĩ này")
  }
  if (appointment.encounter) {
    throw new Error("ENCOUNTER_REQUIRED: Hãy hoàn tất encounter sau khi chốt hồ sơ bệnh án")
  }
  if (appointment.status !== AppointmentStatus.CONFIRMED) {
    throw new Error(
      `INVALID_STATUS: Ca phải ở trạng thái CONFIRMED, hiện tại: ${appointment.status}`,
    )
  }
  if (appointment.appointmentDate.getTime() > Date.now()) {
    throw new Error("VISIT_NOT_STARTED: Chỉ được hoàn thành khi đã tới giờ khám")
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.COMPLETED },
  })
  await notifyAppointmentCompleted(appointmentId)
  revalidateClinicalPaths()
  return updated
}

export async function getActiveServices() {
  await getDoctorProfile()
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })
}

export async function updateMedicalRecord(
  medicalRecordId: string,
  data: {
    diagnosis?: string
    notes?: string
    planDescription?: string
    targetSessions?: number | null
  },
) {
  const profile = await getDoctorProfile()
  await assertTreatmentEditable(medicalRecordId, profile.doctorProfile!.id)

  const record = await prisma.medicalRecord.update({
    where: { id: medicalRecordId },
    data: {
      diagnosis: data.diagnosis?.trim() ? data.diagnosis.trim() : null,
      notes: data.notes?.trim() ? data.notes.trim() : null,
      ...(data.planDescription !== undefined && {
        planDescription: data.planDescription.trim() || null,
      }),
      ...(data.targetSessions !== undefined && {
        targetSessions: data.targetSessions && data.targetSessions > 0 ? data.targetSessions : null,
      }),
    },
  })

  revalidateClinicalPaths()
  return record
}

export async function incrementCompletedSessions(medicalRecordId: string) {
  const profile = await getDoctorProfile()

  const record = await prisma.medicalRecord.findUnique({
    where: { id: medicalRecordId },
    include: {
      appointment: { select: { doctorId: true, status: true } },
    },
  })
  if (!record) throw new Error("MEDICAL_RECORD_NOT_FOUND")
  if (record.appointment.doctorId !== profile.doctorProfile!.id) {
    throw new Error("FORBIDDEN: Không phải ca của bác sĩ này")
  }
  if (record.status === MedicalRecordStatus.FINALIZED) {
    throw new Error("MEDICAL_RECORD_FINALIZED: Hồ sơ đã chốt, không thể ghi nhận buổi")
  }
  if (!record.targetSessions) throw new Error("NO_PLAN: Hồ sơ này chưa có phác đồ điều trị")
  if (record.completedSessions >= record.targetSessions) {
    throw new Error("PLAN_COMPLETED: Đã hoàn thành đủ số buổi theo phác đồ")
  }

  const updated = await prisma.medicalRecord.update({
    where: { id: medicalRecordId },
    data: { completedSessions: { increment: 1 } },
  })

  revalidateClinicalPaths()
  return updated
}
