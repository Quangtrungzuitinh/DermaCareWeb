"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { sendNotification } from "@/services/notification.service"
import type { UiWaitlistEntry } from "@/services/clinic.types"

async function getPatientProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("UNAUTHORIZED")

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, role: true },
  })
  if (!profile || profile.role !== "PATIENT") {
    throw new Error("FORBIDDEN: Chỉ bệnh nhân mới có thể đăng ký hàng chờ")
  }
  return profile
}

async function getStaffProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("UNAUTHORIZED")

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, role: true },
  })
  if (!profile || !["STAFF", "ADMIN"].includes(profile.role)) {
    throw new Error("FORBIDDEN: Chỉ STAFF hoặc ADMIN mới có thể thao tác hàng chờ")
  }
  return profile
}

function revalidateWaitlistPaths() {
  revalidatePath("/patient/waitlist")
  revalidatePath("/staff/appointments")
}

export async function joinWaitlist(params: {
  serviceId: string
  preferredDoctorId?: string | null
  notes?: string
}): Promise<{ success: boolean }> {
  const patient = await getPatientProfile()

  const [service, patientProfile] = await Promise.all([
    prisma.service.findUnique({ where: { id: params.serviceId, isActive: true } }),
    prisma.profile.findUnique({ where: { id: patient.id }, select: { fullName: true } }),
  ])
  if (!service) throw new Error("SERVICE_NOT_FOUND_OR_INACTIVE")

  let preferredDoctorName: string | null = null
  if (params.preferredDoctorId) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: params.preferredDoctorId, isActive: true },
      include: { profile: { select: { fullName: true } } },
    })
    if (!doctor) throw new Error("DOCTOR_NOT_FOUND_OR_INACTIVE")
    preferredDoctorName = doctor.profile?.fullName ?? null
  }

  const duplicate = await prisma.waitlistEntry.findFirst({
    where: {
      patientId: patient.id,
      serviceId: params.serviceId,
      status: { in: ["WAITING", "NOTIFIED"] },
    },
  })
  if (duplicate) throw new Error("ALREADY_WAITLISTED")

  await prisma.waitlistEntry.create({
    data: {
      patientId: patient.id,
      serviceId: params.serviceId,
      preferredDoctorId: params.preferredDoctorId ?? null,
      notes: params.notes?.trim() || null,
      status: "WAITING",
    },
  })

  // Notify all staff about the new waitlist entry
  const staffProfiles = await prisma.profile.findMany({
    where: { role: { in: ["STAFF", "ADMIN"] } },
    select: { id: true },
  })

  const patientName = patientProfile?.fullName ?? "Bệnh nhân"
  const body = preferredDoctorName
    ? `${service.name} · BS. ${preferredDoctorName}`
    : service.name

  await Promise.all(
    staffProfiles.map((staff) =>
      sendNotification({
        recipientId: staff.id,
        senderId: patient.id,
        type: "SYSTEM",
        title: `${patientName} đăng ký hàng chờ`,
        body,
        metadata: { href: "/staff/appointments?tab=waitlist" },
      }),
    ),
  )

  revalidateWaitlistPaths()
  return { success: true }
}

export async function cancelWaitlistEntry(entryId: string): Promise<{ success: boolean }> {
  const patient = await getPatientProfile()

  const entry = await prisma.waitlistEntry.findUnique({
    where: { id: entryId },
    select: { patientId: true, status: true },
  })
  if (!entry) throw new Error("WAITLIST_ENTRY_NOT_FOUND")
  if (entry.patientId !== patient.id) throw new Error("FORBIDDEN")
  if (!["WAITING", "NOTIFIED"].includes(entry.status)) {
    throw new Error("INVALID_STATUS: Chỉ có thể hủy khi đang WAITING hoặc NOTIFIED")
  }

  await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: { status: "CANCELLED" },
  })

  revalidateWaitlistPaths()
  return { success: true }
}

export async function getMyWaitlist(): Promise<UiWaitlistEntry[]> {
  const patient = await getPatientProfile()

  const entries = await prisma.waitlistEntry.findMany({
    where: { patientId: patient.id },
    include: {
      service: { select: { id: true, name: true, price: true } },
      preferredDoctor: {
        include: { profile: { select: { fullName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return entries.map((entry) => ({
    id: entry.id,
    status: entry.status,
    serviceName: entry.service.name,
    servicePrice: entry.service.price,
    preferredDoctorName: entry.preferredDoctor?.profile?.fullName ?? null,
    notes: entry.notes,
    notifiedAt: entry.notifiedAt?.toISOString() ?? null,
    expiresAt: entry.expiresAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
  }))
}

export async function notifyWaitlistForSlot(cancelledAppointmentId: string) {
  await getStaffProfile()

  const cancelled = await prisma.appointment.findUnique({
    where: { id: cancelledAppointmentId },
    select: { doctorId: true, status: true },
  })
  if (!cancelled) throw new Error("APPOINTMENT_NOT_FOUND")
  if (cancelled.status !== "CANCELLED") throw new Error("APPOINTMENT_NOT_CANCELLED")

  const entry =
    (await prisma.waitlistEntry.findFirst({
      where: { status: "WAITING", preferredDoctorId: cancelled.doctorId },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.waitlistEntry.findFirst({
      where: { status: "WAITING", preferredDoctorId: null },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.waitlistEntry.findFirst({
      where: { status: "WAITING" },
      orderBy: { createdAt: "asc" },
    }))

  if (!entry) return { notified: false, reason: "NO_WAITLIST" }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: { status: "NOTIFIED", notifiedAt: new Date(), expiresAt },
  })

  await sendNotification({
    recipientId: entry.patientId,
    type: "APPOINTMENT",
    title: "Có lịch hẹn trống!",
    body: "Một slot vừa được giải phóng. Vui lòng đặt lịch trong vòng 24 giờ trước khi hết hạn.",
    metadata: { href: "/booking", waitlistEntryId: entry.id },
  })

  revalidateWaitlistPaths()
  return { notified: true, patientId: entry.patientId }
}
