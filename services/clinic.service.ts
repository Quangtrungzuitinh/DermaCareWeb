import "server-only"

import { formatInTimeZone } from "date-fns-tz"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/require-role"
import { DEFAULT_SLOT_DURATION_MIN } from "@/lib/constants"
import type { Prisma, Role } from "@/lib/generated/prisma"
import { TZ } from "@/lib/format"
import type {
  UiAppointment,
  UiBlockedSlot,
  UiDoctor,
  UiProfile,
  UiScheduleRule,
  UiService,
} from "@/services/clinic.types"

const appointmentInclude = {
  doctor: { include: { profile: true } },
  patient: true,
  payment: { include: { confirmedBy: true } },
  medicalRecord: {
    include: {
      prescriptions: {
        include: {
          items: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      skinImages: {
        where: { deletedAt: null },
        orderBy: { capturedAt: "desc" },
      },
      treatments: { include: { service: true }, orderBy: { createdAt: "asc" } },
    },
  },
} satisfies Prisma.AppointmentInclude

type AppointmentRow = Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>

function serializeProfile(
  profile: NonNullable<AppointmentRow["patient"]> | Prisma.ProfileGetPayload<object>,
): UiProfile {
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
    role: profile.role,
    birthYear: profile.birthYear,
    province: profile.province,
    district: profile.district,
    createdAt: profile.createdAt.toISOString(),
  }
}

function serializeDoctor(doctor: AppointmentRow["doctor"]): UiDoctor {
  return {
    id: doctor.id,
    profileId: doctor.profileId ?? "",
    fullName: doctor.profile ? `BS. ${doctor.profile.fullName}` : "Bác sĩ đã ngừng hoạt động",
    email: doctor.profile?.email ?? null,
    phone: doctor.profile?.phone ?? null,
    licenseNumber: doctor.licenseNumber,
    seniorityLevel: doctor.seniorityLevel,
    specialty: doctor.specialty,
    isActive: doctor.isActive,
    approvalStatus: doctor.approvalStatus,
  }
}

function serializeAppointment(row: AppointmentRow): UiAppointment {
  const durationMin =
    row.medicalRecord?.treatments[0]?.service.durationMinutes ?? DEFAULT_SLOT_DURATION_MIN

  return {
    id: row.id,
    status: row.status,
    appointmentDate: row.appointmentDate.toISOString(),
    durationMin,
    baseFee: row.baseFee,
    notes: row.notes,
    visitReason: row.visitReason,
    payAtClinic: row.payAtClinic,
    guestName: row.guestName,
    guestPhone: row.guestPhone,
    guestEmail: row.guestEmail,
    aiPredictedCondition: row.aiPredictedCondition ?? null,
    aiConfidenceScore: row.aiConfidenceScore ?? null,
    patient: row.patient ? serializeProfile(row.patient) : null,
    doctor: serializeDoctor(row.doctor),
    payment: row.payment
      ? {
          id: row.payment.id,
          amount: row.payment.amount,
          status: row.payment.status,
          confirmationSource: row.payment.confirmationSource,
          confirmedAt: row.payment.confirmedAt?.toISOString() ?? null,
          confirmedByName: row.payment.confirmedBy?.fullName ?? null,
        }
      : null,
    medicalRecord: row.medicalRecord
      ? {
          id: row.medicalRecord.id,
          encounterId: row.medicalRecord.encounterId,
          status: row.medicalRecord.status,
          diagnosis: row.medicalRecord.diagnosis,
          notes: row.medicalRecord.notes,
          guestSnapshotName: row.medicalRecord.guestSnapshotName,
          guestSnapshotPhone: row.medicalRecord.guestSnapshotPhone,
          planDescription: row.medicalRecord.planDescription ?? null,
          targetSessions: row.medicalRecord.targetSessions ?? null,
          completedSessions: row.medicalRecord.completedSessions,
          prescriptions: row.medicalRecord.prescriptions.map((prescription) => ({
            id: prescription.id,
            note: prescription.note,
            createdAt: prescription.createdAt.toISOString(),
            items: prescription.items.map((item) => ({
              id: item.id,
              medicationName: item.medicationName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instruction: item.instruction,
            })),
          })),
          skinImages: row.medicalRecord.skinImages.map((image) => ({
            id: image.id,
            fileName: image.fileName,
            mimeType: image.mimeType,
            thumbnailUrl: image.thumbnailUrl,
            bodyArea: image.bodyArea,
            capturedAt: image.capturedAt.toISOString(),
            note: image.note,
          })),
          treatments: row.medicalRecord.treatments.map((treatment) => ({
            id: treatment.id,
            serviceId: treatment.serviceId,
            serviceName: treatment.service.name,
            quantity: treatment.quantity,
            priceAtTime: treatment.priceAtTime,
            notes: treatment.notes,
          })),
        }
      : null,
  }
}

function appointmentOrder() {
  return { appointmentDate: "desc" } satisfies Prisma.AppointmentOrderByWithRelationInput
}

export async function getDoctors(): Promise<UiDoctor[]> {
  const rows = await prisma.doctorProfile.findMany({
    orderBy: { createdAt: "asc" },
    include: { profile: true },
  })

  return rows.filter((doctor) => doctor.profile).map(serializeDoctor)
}

export async function getPendingDoctorApprovals(): Promise<UiDoctor[]> {
  await requireRole(["ADMIN"])
  const rows = await prisma.doctorProfile.findMany({
    where: { approvalStatus: "SUBMITTED" },
    orderBy: { updatedAt: "desc" },
    include: { profile: true },
  })

  return rows.map(serializeDoctor)
}

export async function getServices(includeInactive = true): Promise<UiService[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const rows = await prisma.service.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          treatments: {
            where: { createdAt: { gte: since } },
          },
        },
      },
    },
  })

  return rows.map((service) => ({
    id: service.id,
    name: service.name,
    price: service.price,
    description: service.description,
    durationMinutes: service.durationMinutes,
    isActive: service.isActive,
    bookingCount30d: service._count.treatments,
  }))
}

export async function getProfilesByRole(role?: Role): Promise<UiProfile[]> {
  const rows = await prisma.profile.findMany({
    where: role ? { role } : undefined,
    orderBy: { createdAt: "desc" },
  })
  return rows.map(serializeProfile)
}

export async function getStaffHomeData() {
  await requireRole(["STAFF", "ADMIN"])
  const appointments = await prisma.appointment.findMany({
    orderBy: appointmentOrder(),
    take: 200,
    include: appointmentInclude,
  })
  const services = await getServices()
  const patients = await getProfilesByRole("PATIENT")
  return {
    profile: (await requireRole(["STAFF", "ADMIN"])).profile,
    appointments: appointments.map(serializeAppointment),
    services,
    patients,
    generatedAt: new Date().toISOString(),
  }
}

export async function getStaffAppointments(): Promise<UiAppointment[]> {
  await requireRole(["STAFF", "ADMIN"])
  const rows = await prisma.appointment.findMany({
    orderBy: appointmentOrder(),
    include: appointmentInclude,
  })
  return rows.map(serializeAppointment)
}

export async function getStaffAppointment(id: string): Promise<UiAppointment | null> {
  await requireRole(["STAFF", "ADMIN"])
  const row = await prisma.appointment.findUnique({ where: { id }, include: appointmentInclude })
  return row ? serializeAppointment(row) : null
}

export async function getStaffPatients() {
  await requireRole(["STAFF", "ADMIN"])
  const patients = await getProfilesByRole("PATIENT")
  const appointments = await getStaffAppointments()
  return { patients, appointments }
}

export async function getStaffPayments() {
  await requireRole(["STAFF", "ADMIN"])
  const appointments = await getStaffAppointments()
  return appointments.filter(
    (appointment) => appointment.status === "PENDING_PAYMENT" || appointment.payment,
  )
}

export async function getStaffScheduleData() {
  await requireRole(["STAFF", "ADMIN"])
  return {
    doctors: await getDoctors(),
    appointments: await getStaffAppointments(),
  }
}

export async function getDoctorHomeData() {
  const { profile } = await requireRole(["DOCTOR"])
  const doctorId = profile.doctorProfile?.id
  const appointments = doctorId
    ? await prisma.appointment.findMany({
        where: { doctorId },
        orderBy: appointmentOrder(),
        take: 200,
        include: appointmentInclude,
      })
    : []

  return {
    profile,
    doctor: profile.doctorProfile,
    appointments: appointments.map(serializeAppointment),
    services: await getServices(),
    generatedAt: new Date().toISOString(),
  }
}

export async function getDoctorAppointments(): Promise<UiAppointment[]> {
  const { profile } = await requireRole(["DOCTOR"])
  if (!profile.doctorProfile) return []
  const rows = await prisma.appointment.findMany({
    where: { doctorId: profile.doctorProfile.id },
    orderBy: appointmentOrder(),
    include: appointmentInclude,
  })
  return rows.map(serializeAppointment)
}

export async function getDoctorMedicalRecords(): Promise<UiAppointment[]> {
  const rows = await getDoctorAppointments()
  return rows.filter((row) => row.medicalRecord)
}

export async function getAdminHomeData() {
  const { profile } = await requireRole(["ADMIN"])
  const [appointments, doctors, services, users] = await Promise.all([
    prisma.appointment.findMany({
      orderBy: appointmentOrder(),
      include: appointmentInclude,
    }),
    getDoctors(),
    getServices(),
    getProfilesByRole(),
  ])
  return {
    profile,
    appointments: appointments.map(serializeAppointment),
    doctors,
    services,
    users,
    generatedAt: new Date().toISOString(),
  }
}

export async function getDoctorSchedule(doctorId: string): Promise<{
  rules: UiScheduleRule[]
  blockedSlots: UiBlockedSlot[]
}> {
  await requireRole(["ADMIN"])
  const [rules, blockedSlots] = await Promise.all([
    prisma.doctorScheduleRule.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
    }),
    prisma.doctorBlockedSlot.findMany({ where: { doctorId }, orderBy: { blockedDate: "asc" } }),
  ])

  return {
    rules: rules.map((rule) => ({
      id: rule.id,
      doctorId: rule.doctorId,
      dayOfWeek: rule.dayOfWeek,
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
      slotDuration: rule.slotDuration,
      maxPatients: rule.maxPatients,
      isActive: rule.isActive,
    })),
    blockedSlots: blockedSlots.map((slot) => ({
      id: slot.id,
      doctorId: slot.doctorId,
      blockedDate: formatInTimeZone(slot.blockedDate, TZ, "yyyy-MM-dd"),
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      reason: slot.reason,
      isActive: slot.isActive,
    })),
  }
}

export { serializeAppointment }
