import "server-only"

import { formatInTimeZone } from "date-fns-tz"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { AppointmentStatus, type Prisma } from "@/lib/generated/prisma"
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants"
import { TZ } from "@/lib/format"
import type {
  PatientAppointment,
  PatientDashboardAppointment,
  PatientDashboardData,
  PatientHealthSummary,
  PatientMedicalDocument,
  PatientMedicalRecord,
  PatientPrescription,
  PatientTreatment,
  TimelineEvent,
} from "@/services/patient.types"
import { getPatientProgress, toPatientProgressSummary } from "@/services/skin-analysis.service"

export class PatientProfileNotFoundError extends Error {
  constructor() {
    super("PATIENT_PROFILE_NOT_FOUND")
    this.name = "PatientProfileNotFoundError"
  }
}

type PatientProfile = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  avatarUrl: string | null
}

type GetMyAppointmentsParams = {
  status?: AppointmentStatus | "ALL"
  from?: Date
  to?: Date
}

type CreatePatientAppointmentPayload = {
  doctorId: string
  appointmentDate: Date
  notes?: string
}

async function getCurrentPatientProfile(): Promise<PatientProfile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
    },
  })

  if (!profile) throw new PatientProfileNotFoundError()

  return profile
}

const appointmentInclude = {
  doctor: {
    include: {
      profile: {
        select: {
          fullName: true,
        },
      },
    },
  },
  payment: true,
  medicalRecord: {
    include: {
      treatments: {
        include: {
          service: true,
        },
      },
    },
  },
} satisfies Prisma.AppointmentInclude

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude
}>

const medicalRecordInclude = {
  appointment: {
    include: {
      doctor: {
        include: {
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  },
  treatments: {
    include: {
      service: true,
    },
  },
  prescriptions: {
    include: {
      doctor: { include: { profile: { select: { fullName: true } } } },
      items: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  },
  skinImages: {
    where: { deletedAt: null },
    orderBy: { capturedAt: "desc" },
  },
} satisfies Prisma.MedicalRecordInclude

type MedicalRecordWithRelations = Prisma.MedicalRecordGetPayload<{
  include: typeof medicalRecordInclude
}>

function serializeAppointment(appointment: AppointmentWithRelations): PatientAppointment {
  return {
    id: appointment.id,
    appointmentDate: appointment.appointmentDate.toISOString(),
    durationMin: 60,
    status: appointment.status,
    baseFee: appointment.baseFee,
    notes: appointment.notes,
    paymentStatus: appointment.payment?.status ?? "UNPAID",
    paymentId: appointment.payment?.id ?? null,
    doctor: {
      id: appointment.doctor.id,
      fullName: `BS. ${appointment.doctor.profile?.fullName ?? "Bác sĩ đã ngừng hoạt động"}`,
      specialty: appointment.doctor.specialty,
    },
    services:
      appointment.medicalRecord?.treatments.map((treatment) => ({
        id: treatment.service.id,
        name: treatment.service.name,
        quantity: treatment.quantity,
        priceAtTime: treatment.priceAtTime,
        notes: treatment.notes,
      })) ?? [],
    medicalRecord: appointment.medicalRecord
      ? {
          id: appointment.medicalRecord.id,
          diagnosis: appointment.medicalRecord.diagnosis,
          notes: appointment.medicalRecord.notes,
          planDescription: appointment.medicalRecord.planDescription,
          targetSessions: appointment.medicalRecord.targetSessions,
          completedSessions: appointment.medicalRecord.completedSessions,
        }
      : null,
  }
}

function serializeMedicalRecord(record: MedicalRecordWithRelations): PatientMedicalRecord {
  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    diagnosis: record.diagnosis,
    notes: record.notes,
    planDescription: record.planDescription,
    targetSessions: record.targetSessions,
    completedSessions: record.completedSessions,
    visitReason: record.appointment?.visitReason ?? null,
    appointment: record.appointment
      ? {
          id: record.appointment.id,
          appointmentDate: record.appointment.appointmentDate.toISOString(),
          status: record.appointment.status,
          doctor: {
            id: record.appointment.doctor.id,
            fullName: `BS. ${record.appointment.doctor.profile?.fullName ?? "Bác sĩ đã ngừng hoạt động"}`,
            specialty: record.appointment.doctor.specialty,
          },
        }
      : null,
    skinImages: record.skinImages.map((image) => ({
      id: image.id,
      fileName: image.fileName,
      thumbnailUrl: image.thumbnailUrl,
      bodyArea: image.bodyArea,
      capturedAt: image.capturedAt.toISOString(),
      note: image.note,
    })),
    treatments: record.treatments.map((treatment) => serializeTreatment(treatment)),
    prescriptions: record.prescriptions.map(serializePrescription),
  }
}

function serializeTreatment(treatment: MedicalRecordWithRelations["treatments"][number]): PatientTreatment {
  return {
    id: treatment.id,
    medicalRecordId: treatment.medicalRecordId,
    serviceName: treatment.service.name,
    instruction: treatment.notes,
    quantity: treatment.quantity,
    priceAtTime: treatment.priceAtTime,
    createdAt: treatment.createdAt.toISOString(),
  }
}

type PrescriptionWithRelations = MedicalRecordWithRelations["prescriptions"][number]

function serializePrescription(prescription: PrescriptionWithRelations): PatientPrescription {
  const activeUntil = new Date(prescription.createdAt)
  activeUntil.setDate(activeUntil.getDate() + 30)

  return {
    id: prescription.id,
    medicalRecordId: prescription.medicalRecordId,
    note: prescription.note,
    createdAt: prescription.createdAt.toISOString(),
    status: activeUntil.getTime() >= Date.now() ? "ACTIVE" : "ENDED",
    doctor: prescription.doctor
      ? {
          id: prescription.doctor.id,
          fullName: `BS. ${prescription.doctor.profile?.fullName ?? "Bác sĩ đã ngừng hoạt động"}`,
          specialty: prescription.doctor.specialty,
        }
      : null,
    items: prescription.items.map((item) => ({
      id: item.id,
      medicationName: item.medicationName,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instruction: item.instruction,
    })),
  }
}

export const appointmentService = {
  async getMyAppointments(params: GetMyAppointmentsParams = {}): Promise<PatientAppointment[]> {
    const profile = await getCurrentPatientProfile()
    const where: Prisma.AppointmentWhereInput = {
      patientId: profile.id,
      ...(params.status && params.status !== "ALL" ? { status: params.status } : {}),
      ...(params.from || params.to
        ? {
            appointmentDate: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: "asc" },
      include: appointmentInclude,
    })

    return appointments.map(serializeAppointment)
  },

  async getAppointmentById(id: string): Promise<PatientAppointment | null> {
    const profile = await getCurrentPatientProfile()
    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: profile.id },
      include: appointmentInclude,
    })

    return appointment ? serializeAppointment(appointment) : null
  },

  async cancelAppointment(id: string): Promise<PatientAppointment> {
    const profile = await getCurrentPatientProfile()
    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: profile.id },
      include: appointmentInclude,
    })

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND")
    if (
      appointment.status !== AppointmentStatus.CONFIRMED &&
      appointment.status !== AppointmentStatus.PENDING_PAYMENT
    ) {
      throw new Error("APPOINTMENT_NOT_CANCELLABLE")
    }
    if (appointment.appointmentDate.getTime() <= Date.now()) {
      throw new Error("APPOINTMENT_NOT_CANCELLABLE")
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: appointmentInclude,
    })

    return serializeAppointment(updated)
  },

  async createAppointment(payload: CreatePatientAppointmentPayload): Promise<PatientAppointment> {
    const profile = await getCurrentPatientProfile()

    try {
      const appointment = await prisma.appointment.create({
        data: {
          doctorId: payload.doctorId,
          appointmentDate: payload.appointmentDate,
          patientId: profile.id,
          notes: payload.notes ?? null,
          baseFee: APPOINTMENT_DEPOSIT_AMOUNT,
        },
        include: appointmentInclude,
      })

      return serializeAppointment(appointment)
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
  },
}

export const healthRecordService = {
  async getMyHealthSummary(): Promise<PatientHealthSummary> {
    const profile = await getCurrentPatientProfile()
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: profile.id },
      orderBy: { createdAt: "desc" },
      include: medicalRecordInclude,
    })
    const prescriptions = records.flatMap((record) => record.prescriptions.map(serializePrescription))

    return {
      profile,
      totalVisits: records.length,
      latestVisit:
        records[0]?.appointment?.appointmentDate.toISOString() ??
        records[0]?.createdAt.toISOString() ??
        null,
      activePrescriptions: prescriptions.filter((prescription) => prescription.status === "ACTIVE")
        .length,
      documentCount: 0,
      latestRecord: records[0] ? serializeMedicalRecord(records[0]) : null,
    }
  },

  async getMyMedicalRecords(): Promise<PatientMedicalRecord[]> {
    const profile = await getCurrentPatientProfile()
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: profile.id },
      orderBy: { createdAt: "desc" },
      include: medicalRecordInclude,
    })

    return records.map(serializeMedicalRecord)
  },

  async getMedicalRecordById(id: string): Promise<PatientMedicalRecord | null> {
    const profile = await getCurrentPatientProfile()
    const record = await prisma.medicalRecord.findFirst({
      where: { id, patientId: profile.id },
      include: medicalRecordInclude,
    })

    return record ? serializeMedicalRecord(record) : null
  },

  async getMyPrescriptions(): Promise<PatientPrescription[]> {
    const profile = await getCurrentPatientProfile()
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { include: { profile: { select: { fullName: true } } } },
        items: { orderBy: { createdAt: "asc" } },
      },
    })

    return prescriptions.map(serializePrescription)
  },

  async getMyMedicalDocuments(): Promise<PatientMedicalDocument[]> {
    await getCurrentPatientProfile()
    return []
  },

  async getMyProgress() {
    const profile = await getCurrentPatientProfile()
    return toPatientProgressSummary(await getPatientProgress({ patientId: profile.id }))
  },
}

export const timelineService = {
  async getMyTimeline(params: { limit?: number } = {}): Promise<TimelineEvent[]> {
    const profile = await getCurrentPatientProfile()
    const limit = params.limit ?? 40

    const [appointments, records, prescriptions, skinImages, planSteps, followUps] =
      await Promise.all([
        prisma.appointment.findMany({
          where: { patientId: profile.id },
          orderBy: { appointmentDate: "desc" },
          take: limit,
          include: { doctor: { include: { profile: { select: { fullName: true } } } } },
        }),
        prisma.medicalRecord.findMany({
          where: { patientId: profile.id },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        prisma.prescription.findMany({
          where: { patientId: profile.id },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: { items: true },
        }),
        prisma.skinImage.findMany({
          where: { patientId: profile.id, deletedAt: null },
          orderBy: { capturedAt: "desc" },
          take: limit,
        }),
        prisma.treatmentPlanStep.findMany({
          where: { plan: { patientId: profile.id } },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: { plan: true },
        }),
        prisma.followUpNote.findMany({
          where: { patientId: profile.id },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
      ])

    const events: TimelineEvent[] = [
      ...appointments.map((appointment) => ({
        id: `appointment:${appointment.id}`,
        type: "APPOINTMENT" as const,
        date: appointment.appointmentDate.toISOString(),
        title: "Lịch khám",
        summary: `${appointment.doctor.profile?.fullName ?? "Bác sĩ"} · ${appointment.status}`,
        meta: { appointmentId: appointment.id, status: appointment.status },
      })),
      ...records.map((record) => ({
        id: `record:${record.id}`,
        type: "MEDICAL_RECORD" as const,
        date: record.createdAt.toISOString(),
        title: "Hồ sơ bệnh án",
        summary: record.diagnosis ?? "Chưa cập nhật chẩn đoán",
        meta: { medicalRecordId: record.id, status: record.status },
      })),
      ...prescriptions.map((prescription) => ({
        id: `prescription:${prescription.id}`,
        type: "PRESCRIPTION" as const,
        date: prescription.createdAt.toISOString(),
        title: "Đơn thuốc",
        summary: `${prescription.items.length} thuốc`,
        meta: { prescriptionId: prescription.id },
      })),
      ...skinImages.map((image) => ({
        id: `skin-image:${image.id}`,
        type: "SKIN_IMAGE" as const,
        date: image.capturedAt.toISOString(),
        title: "Ảnh theo dõi da",
        summary: image.bodyArea ?? image.fileName,
        meta: { skinImageId: image.id },
      })),
      ...planSteps.map((step) => ({
        id: `plan-step:${step.id}`,
        type: "TREATMENT_PLAN_STEP" as const,
        date: step.createdAt.toISOString(),
        title: `Phác đồ tuần ${step.weekNumber}`,
        summary: step.instruction,
        meta: { planId: step.planId, isDone: step.isDone },
      })),
      ...followUps.map((note) => ({
        id: `follow-up:${note.id}`,
        type: "FOLLOW_UP_NOTE" as const,
        date: note.createdAt.toISOString(),
        title: "Ghi chú theo dõi",
        summary: note.nextAction ?? note.note,
        meta: { followUpId: note.id, scheduledDate: note.scheduledDate?.toISOString() ?? null },
      })),
    ]

    return events
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  },
}

export async function getPatientDashboardData(): Promise<PatientDashboardData> {
  const profile = await getCurrentPatientProfile()

  const appointments = await prisma.appointment.findMany({
    where: { patientId: profile.id },
    orderBy: { appointmentDate: "desc" },
    include: {
      doctor: {
        include: {
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
      payment: true,
      medicalRecord: {
        include: {
          treatments: {
            include: {
              service: true,
            },
          },
        },
      },
    },
  })

  const now = new Date()
  const rows = appointments.map(
    (appointment): PatientDashboardAppointment => ({
      id: appointment.id,
      appointmentDate: appointment.appointmentDate.toISOString(),
      durationMin: null,
      status: appointment.status,
      baseFee: appointment.baseFee,
      notes: appointment.notes,
      doctor: {
        id: appointment.doctor.id,
        fullName: `BS. ${appointment.doctor.profile?.fullName ?? "Bác sĩ đã ngừng hoạt động"}`,
        specialty: appointment.doctor.specialty,
      },
    }),
  )

  const upcomingAppointments = rows
    .filter(
      (appointment) =>
        appointment.status === AppointmentStatus.CONFIRMED &&
        new Date(appointment.appointmentDate).getTime() > now.getTime(),
    )
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())

  const completedAppointments = rows.filter(
    (appointment) => appointment.status === AppointmentStatus.COMPLETED,
  )

  const frequentlyVisitedDoctor = getFrequentlyVisitedDoctor(completedAppointments)

  return {
    profile,
    stats: {
      totalAppointments: rows.length,
      upcomingAppointments: upcomingAppointments.length,
      completedAppointments: completedAppointments.length,
      frequentlyVisitedDoctor,
    },
    monthlyCounts: getMonthlyCounts(rows, now),
    upcomingAppointments,
    historyRows: rows.slice(0, 20),
    healthTip: {
      label: "Mẹo hôm nay",
      title: "Uống đủ nước & dùng kem chống nắng SPF 50+ mỗi sáng",
    },
    generatedAt: now.toISOString(),
  }
}

function getFrequentlyVisitedDoctor(rows: PatientDashboardAppointment[]) {
  const counts = new Map<
    string,
    {
      id: string
      name: string
      specialty: string | null
      count: number
      lastVisit: number
    }
  >()

  for (const appointment of rows) {
    const key = appointment.doctor.id
    const visitTime = new Date(appointment.appointmentDate).getTime()
    const current = counts.get(key)

    if (!current) {
      counts.set(key, {
        id: appointment.doctor.id,
        name: appointment.doctor.fullName,
        specialty: appointment.doctor.specialty,
        count: 1,
        lastVisit: visitTime,
      })
      continue
    }

    current.count += 1
    current.lastVisit = Math.max(current.lastVisit, visitTime)
  }

  const [topDoctor] = Array.from(counts.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return b.lastVisit - a.lastVisit
  })

  if (!topDoctor) return null

  return {
    id: topDoctor.id,
    name: topDoctor.name,
    specialty: topDoctor.specialty,
    count: topDoctor.count,
  }
}

function getMonthlyCounts(rows: PatientDashboardAppointment[], now: Date) {
  return Array.from({ length: 6 }, (_, index) => {
    const monthsBack = 5 - index
    const month = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
    const monthKey = formatInTimeZone(month, TZ, "yyyy-MM")

    return {
      label: formatInTimeZone(month, TZ, "MMM"),
      monthKey,
      count: rows.filter(
        (appointment) =>
          formatInTimeZone(new Date(appointment.appointmentDate), TZ, "yyyy-MM") === monthKey,
      ).length,
      isCurrent: monthsBack === 0,
    }
  })
}
