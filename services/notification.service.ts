import "server-only"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/require-role"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import type { NotificationType, Prisma, Role } from "@/lib/generated/prisma"
import type { UiNotification } from "@/services/clinic.types"

const ALL_ROLES: Role[] = ["PATIENT", "DOCTOR", "STAFF", "ADMIN"]

export type NotificationFeed = {
  role: Role
  notifications: UiNotification[]
  unreadCount: number
}

const notificationInclude = {
  recipient: { select: { id: true, fullName: true, role: true } },
  sender: { select: { id: true, fullName: true } },
} as const

type NotificationRow = Prisma.NotificationGetPayload<{ include: typeof notificationInclude }>

function getNotificationHref(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const href = (metadata as Record<string, unknown>).href
  if (typeof href !== "string" || !href.startsWith("/")) return null

  const role = (metadata as Record<string, unknown>).role
  if (role === "DOCTOR" && (href === "/doctor" || href === "/doctor/onboarding")) {
    return "/doctor?onboarding=1"
  }
  if (href === "/doctor/onboarding") return "/doctor?onboarding=1"

  return href
}

function getRejectReason(metadata: Prisma.JsonValue | null): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const reason = (metadata as Record<string, unknown>).rejectReason
  return typeof reason === "string" && reason.trim() ? reason.trim() : null
}

function serializeNotification(row: NotificationRow): UiNotification {
  const metadataHref = getNotificationHref(row.metadata)
  const fallbackHref =
    row.title === "Lịch hẹn đã tạo" && row.appointmentId
      ? `/patient/booking/payment/${row.appointmentId}`
      : null

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: metadataHref ?? fallbackHref,
    rejectReason: getRejectReason(row.metadata),
    recipientId: row.recipientId,
    recipientName: row.recipient.fullName,
    recipientRole: row.recipientRole,
    senderId: row.senderId,
    senderName: row.sender?.fullName ?? null,
    appointmentId: row.appointmentId,
    isRead: row.isRead,
    readAt: row.readAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

function isMissingNotificationTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  )
}

function revalidateNotificationPaths() {
  revalidatePath("/admin/notifications")
  revalidatePath("/staff/notifications")
  revalidatePath("/doctor/notifications")
  revalidatePath("/patient/notifications")
}

export async function getMyNotificationFeed(limit = 10): Promise<NotificationFeed> {
  const { profile } = await requireRole(ALL_ROLES)
  try {
    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: profile.id, revokedAt: null },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: notificationInclude,
      }),
      prisma.notification.count({
        where: { recipientId: profile.id, revokedAt: null, isRead: false },
      }),
    ])

    return {
      role: profile.role,
      notifications: rows.map(serializeNotification),
      unreadCount,
    }
  } catch (error) {
    if (isMissingNotificationTable(error)) {
      return { role: profile.role, notifications: [], unreadCount: 0 }
    }
    throw error
  }
}

export async function getMyNotifications(limit = 100): Promise<UiNotification[]> {
  const { profile } = await requireRole(ALL_ROLES)
  try {
    const rows = await prisma.notification.findMany({
      where: { recipientId: profile.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: notificationInclude,
    })
    return rows.map(serializeNotification)
  } catch (error) {
    if (isMissingNotificationTable(error)) return []
    throw error
  }
}

export async function getAllNotifications(limit = 300): Promise<UiNotification[]> {
  await requireRole(["ADMIN"])
  try {
    const rows = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: notificationInclude,
    })
    return rows.map(serializeNotification)
  } catch (error) {
    if (isMissingNotificationTable(error)) return []
    throw error
  }
}

export async function sendNotification(input: {
  recipientId: string
  senderId?: string | null
  appointmentId?: string | null
  type?: NotificationType
  title: string
  body: string
  metadata?: Prisma.InputJsonObject
}) {
  const recipient = await prisma.profile.findUnique({
    where: { id: input.recipientId },
    select: { id: true, role: true },
  })
  if (!recipient) throw new Error("RECIPIENT_NOT_FOUND")

  const row = await prisma.notification.create({
    data: {
      recipientId: recipient.id,
      recipientRole: recipient.role,
      senderId: input.senderId ?? null,
      appointmentId: input.appointmentId ?? null,
      type: input.type ?? "SYSTEM",
      title: input.title,
      body: input.body,
      metadata: input.metadata ?? undefined,
    },
    include: notificationInclude,
  })
  revalidateNotificationPaths()
  return serializeNotification(row)
}

export async function sendManualNotification(input: {
  recipientId: string
  title: string
  body: string
  appointmentId?: string | null
}) {
  const { profile } = await requireRole(["STAFF", "ADMIN"])
  const recipient = await prisma.profile.findUnique({
    where: { id: input.recipientId },
    select: { id: true, role: true },
  })
  if (!recipient) throw new Error("RECIPIENT_NOT_FOUND")

  if (profile.role === "STAFF" && !["PATIENT", "DOCTOR"].includes(recipient.role)) {
    throw new Error("FORBIDDEN: STAFF chỉ gửi thủ công cho PATIENT hoặc DOCTOR")
  }

  return sendNotification({
    recipientId: recipient.id,
    senderId: profile.id,
    appointmentId: input.appointmentId ?? null,
    type: "MANUAL",
    title: input.title,
    body: input.body,
  })
}

export async function sendBroadcast(input: { target: Role | "ALL"; title: string; body: string }) {
  const { profile } = await requireRole(["ADMIN"])
  const recipients = await prisma.profile.findMany({
    where: {
      id: { not: profile.id },
      ...(input.target === "ALL" ? {} : { role: input.target }),
    },
    select: { id: true, role: true },
  })

  if (recipients.length === 0) return { count: 0 }

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      recipientId: recipient.id,
      recipientRole: recipient.role,
      senderId: profile.id,
      type: "BROADCAST" as NotificationType,
      title: input.title,
      body: input.body,
      metadata: { target: input.target },
    })),
  })
  revalidateNotificationPaths()
  return { count: recipients.length }
}

export async function markNotificationRead(id: string) {
  const { profile } = await requireRole(ALL_ROLES)
  await prisma.notification.updateMany({
    where: { id, recipientId: profile.id, revokedAt: null },
    data: { isRead: true, readAt: new Date() },
  })
  revalidateNotificationPaths()
}

export async function markAllNotificationsRead() {
  const { profile } = await requireRole(ALL_ROLES)
  await prisma.notification.updateMany({
    where: { recipientId: profile.id, revokedAt: null, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
  revalidateNotificationPaths()
}

export async function revokeNotification(id: string) {
  const { profile } = await requireRole(["STAFF", "ADMIN"])
  const current = await prisma.notification.findUnique({
    where: { id },
    select: { senderId: true, type: true },
  })
  if (!current) throw new Error("NOTIFICATION_NOT_FOUND")
  if (profile.role === "STAFF" && current.senderId !== profile.id) {
    throw new Error("FORBIDDEN: STAFF chỉ thu hồi thông báo mình đã gửi")
  }

  await prisma.notification.update({
    where: { id },
    data: { revokedAt: new Date() },
  })
  revalidateNotificationPaths()
}

async function getAppointmentForNotification(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: { include: { profile: true } },
      medicalRecord: { include: { treatments: true } },
    },
  })
}

function shortId(id: string) {
  return `#A_${id.slice(-6).toUpperCase()}`
}

function appointmentPatientName(
  appointment: NonNullable<Awaited<ReturnType<typeof getAppointmentForNotification>>>,
) {
  return appointment.patient?.fullName ?? appointment.guestName ?? "Khách vãng lai"
}

function appointmentDoctorName(
  appointment: NonNullable<Awaited<ReturnType<typeof getAppointmentForNotification>>>,
) {
  return appointment.doctor.profile?.fullName ?? "Bác sĩ đã ngừng hoạt động"
}

export async function notifyAppointmentCreated(
  appointmentId: string,
  source: "WEBSITE" | "STAFF" = "WEBSITE",
) {
  const appointment = await getAppointmentForNotification(appointmentId)
  if (!appointment) return

  if (appointment.patientId) {
    await sendNotification({
      recipientId: appointment.patientId,
      appointmentId,
      type: "APPOINTMENT",
      title: "Lịch hẹn đã tạo",
      body: `Lịch hẹn ${shortId(appointment.id)} đã tạo. Chuyển khoản 100.000đ trong 15 phút để giữ slot.`,
      metadata: { href: `/patient/booking/payment/${appointment.id}` },
    })
  }

  if (source === "WEBSITE") {
    const staff = await prisma.profile.findMany({ where: { role: "STAFF" }, select: { id: true } })
    await Promise.all(
      staff.map((recipient) =>
        sendNotification({
          recipientId: recipient.id,
          appointmentId,
          type: "APPOINTMENT",
          title: "Lịch mới từ website",
          body: `Lịch mới ${shortId(appointment.id)}: ${appointmentPatientName(appointment)} · BS. ${appointmentDoctorName(appointment)} · ${formatAppointmentDate(appointment.appointmentDate, "dd/MM/yyyy")} · ${formatAppointmentDate(appointment.appointmentDate, "HH:mm")} · Chờ xác nhận thanh toán.`,
        }),
      ),
    )
  }
}

export async function notifyPaymentConfirmed(appointmentId: string) {
  const appointment = await getAppointmentForNotification(appointmentId)
  if (!appointment) return

  if (appointment.patientId) {
    await sendNotification({
      recipientId: appointment.patientId,
      appointmentId,
      type: "PAYMENT",
      title: "Đặt lịch thành công",
      body: `Đặt lịch thành công! BS. ${appointmentDoctorName(appointment)} · ${formatAppointmentDate(appointment.appointmentDate, "dd/MM/yyyy")} · ${formatAppointmentDate(appointment.appointmentDate, "HH:mm")}.`,
    })
  }

  if (appointment.doctor.profileId) {
    await sendNotification({
      recipientId: appointment.doctor.profileId,
      appointmentId,
      type: "APPOINTMENT",
      title: "Ca khám mới đã xác nhận",
      body: `Ca khám mới: ${appointmentPatientName(appointment)} · ${formatAppointmentDate(appointment.appointmentDate, "dd/MM/yyyy")} · ${formatAppointmentDate(appointment.appointmentDate, "HH:mm")} đã được xác nhận.`,
    })
  }
}

export async function notifyAppointmentCancelled(appointmentId: string, reason?: string) {
  const appointment = await getAppointmentForNotification(appointmentId)
  if (!appointment) return

  if (appointment.patientId) {
    const reasonSuffix = reason ? ` Lý do: ${reason}.` : ""
    await sendNotification({
      recipientId: appointment.patientId,
      appointmentId,
      type: "APPOINTMENT",
      title: "Lịch hẹn đã bị hủy",
      body: `Lịch hẹn ${shortId(appointment.id)} ngày ${formatAppointmentDate(appointment.appointmentDate, "dd/MM/yyyy")} đã bị hủy.${reasonSuffix} Liên hệ phòng khám nếu cần hỗ trợ.`,
      ...(reason ? { metadata: { cancelReason: reason } } : {}),
    })
  }

  if (appointment.doctor.profileId) {
    await sendNotification({
      recipientId: appointment.doctor.profileId,
      appointmentId,
      type: "APPOINTMENT",
      title: "Ca khám đã bị hủy",
      body: `Ca khám ${formatAppointmentDate(appointment.appointmentDate, "dd/MM/yyyy")} · ${formatAppointmentDate(appointment.appointmentDate, "HH:mm")} đã bị hủy. Slot trống trở lại.`,
    })
  }
}

export async function notifyAppointmentCompleted(appointmentId: string) {
  const appointment = await getAppointmentForNotification(appointmentId)
  if (!appointment) return

  const treatmentTotal =
    appointment.medicalRecord?.treatments.reduce(
      (sum, item) => sum + item.priceAtTime * item.quantity,
      0,
    ) ?? 0

  if (appointment.patientId) {
    await sendNotification({
      recipientId: appointment.patientId,
      appointmentId,
      type: "APPOINTMENT",
      title: "Ca khám hoàn thành",
      body: "Ca khám hoàn thành. Vui lòng đến quầy thanh toán dịch vụ.",
    })
  }

  const staff = await prisma.profile.findMany({ where: { role: "STAFF" }, select: { id: true } })
  await Promise.all(
    staff.map((recipient) =>
      sendNotification({
        recipientId: recipient.id,
        appointmentId,
        type: "PAYMENT",
        title: "Chờ thu tiền dịch vụ",
        body: `Ca khám ${shortId(appointment.id)} của ${appointmentPatientName(appointment)} hoàn thành. Tổng dịch vụ: ${formatVND(treatmentTotal)} — chờ thu tiền.`,
      }),
    ),
  )
}

export async function notifyWebhookFailure(appointmentId: string) {
  const admins = await prisma.profile.findMany({ where: { role: "ADMIN" }, select: { id: true } })
  await Promise.all(
    admins.map((recipient) =>
      sendNotification({
        recipientId: recipient.id,
        type: "ALERT",
        title: "Webhook lỗi",
        body: `Webhook lỗi cho lịch ${shortId(appointmentId)}. Cần xác nhận thủ công.`,
      }),
    ),
  )
}
