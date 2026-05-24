import "server-only"

import { prisma } from "@/lib/prisma"
import { DEFAULT_SLOT_DURATION_MIN } from "@/lib/constants"
import { formatAppointmentDate } from "@/lib/format"
import { AppointmentStatus } from "@/lib/generated/prisma"
import { sendNotification } from "@/services/notification.service"

function shortId(id: string) {
  return `#A_${id.slice(-6).toUpperCase()}`
}

type RoleNotificationPayload = Omit<Parameters<typeof sendNotification>[0], "recipientId">

async function sendToRole(role: "STAFF" | "ADMIN", payload: RoleNotificationPayload) {
  const recipients = await prisma.profile.findMany({ where: { role }, select: { id: true } })
  await Promise.all(
    recipients.map((recipient) => sendNotification({ ...payload, recipientId: recipient.id })),
  )
}

async function alreadySent(recipientId: string, title: string, appointmentId?: string | null) {
  return prisma.notification.findFirst({
    where: {
      recipientId,
      title,
      appointmentId: appointmentId ?? null,
      revokedAt: null,
      createdAt: { gte: new Date(Date.now() - 26 * 60 * 60 * 1000) },
    },
    select: { id: true },
  })
}

export async function runNotificationAutomation() {
  const now = new Date()
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const in2hStart = new Date(now.getTime() + 115 * 60 * 1000)
  const in2hEnd = new Date(now.getTime() + 125 * 60 * 1000)
  const arrivalGraceMinutes = DEFAULT_SLOT_DURATION_MIN + 15
  const arrivalCutoff = new Date(now.getTime() - arrivalGraceMinutes * 60 * 1000)
  const tomorrowStart = new Date(now)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  tomorrowStart.setHours(0, 0, 0, 0)
  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)

  const pendingWarning = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.PENDING_PAYMENT,
      createdAt: { lte: tenMinutesAgo, gt: fifteenMinutesAgo },
    },
    include: { doctor: { include: { profile: true } }, patient: true },
  })

  for (const appointment of pendingWarning) {
    await sendToRole("STAFF", {
      type: "REMINDER",
      title: "Lịch sắp tự hủy",
      body: `Lịch ${shortId(appointment.id)} chưa thanh toán, còn 5 phút trước khi tự hủy. Kiểm tra nếu khách đã chuyển khoản.`,
      appointmentId: appointment.id,
    })
  }

  const timedOut = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.PENDING_PAYMENT,
      createdAt: { lte: fifteenMinutesAgo },
    },
    include: { patient: true },
  })

  for (const appointment of timedOut) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CANCELLED },
    })
    if (appointment.patientId) {
      await sendNotification({
        recipientId: appointment.patientId,
        appointmentId: appointment.id,
        type: "REMINDER",
        title: "Lịch hẹn đã quá hạn thanh toán",
        body: `Lịch hẹn ${shortId(appointment.id)} đã bị hủy do quá thời gian. Bạn có thể đặt lại bất cứ lúc nào.`,
      })
    }
  }

  const expiredArrivals = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.CONFIRMED,
      appointmentDate: { lte: arrivalCutoff },
    },
    include: { patient: true, doctor: { include: { profile: true } } },
  })

  for (const appointment of expiredArrivals) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CANCELLED },
    })
    if (appointment.patientId) {
      await sendNotification({
        recipientId: appointment.patientId,
        appointmentId: appointment.id,
        type: "REMINDER",
        title: "Lịch hẹn đã quá giờ xác nhận",
        body: `Lịch hẹn ${shortId(appointment.id)} với BS. ${appointment.doctor.profile?.fullName ?? "Bác sĩ"} đã bị hủy vì quá thời gian mà chưa xác nhận có mặt.`,
      })
    }
  }

  const tomorrowAppointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.CONFIRMED,
      appointmentDate: { gte: tomorrowStart, lt: tomorrowEnd },
    },
    include: { patient: true, doctor: { include: { profile: true } } },
    orderBy: { appointmentDate: "asc" },
  })

  for (const appointment of tomorrowAppointments) {
    if (appointment.patientId) {
      const title = "Nhắc lịch hẹn ngày mai"
      if (!(await alreadySent(appointment.patientId, title, appointment.id))) {
        await sendNotification({
          recipientId: appointment.patientId,
          appointmentId: appointment.id,
          type: "REMINDER",
          title,
          body: `Nhắc lịch: Ngày mai ${formatAppointmentDate(appointment.appointmentDate, "HH:mm")} với BS. ${appointment.doctor.profile?.fullName ?? "Bác sĩ đã ngừng hoạt động"}. Vui lòng đến trước 10 phút.`,
        })
      }
    }
  }

  const byDoctor = new Map<string, typeof tomorrowAppointments>()
  for (const appointment of tomorrowAppointments) {
    if (!appointment.doctor.profileId) continue
    byDoctor.set(appointment.doctor.profileId, [
      ...(byDoctor.get(appointment.doctor.profileId) ?? []),
      appointment,
    ])
  }
  for (const [doctorProfileId, rows] of byDoctor) {
    const title = "Lịch làm việc ngày mai"
    if (!(await alreadySent(doctorProfileId, title))) {
      await sendNotification({
        recipientId: doctorProfileId,
        type: "REMINDER",
        title,
        body: `Lịch làm việc ngày mai: ${rows.length} ca khám. Ca đầu tiên lúc ${formatAppointmentDate(rows[0]!.appointmentDate, "HH:mm")}.`,
      })
    }
  }

  const twoHourAppointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.CONFIRMED,
      appointmentDate: { gte: in2hStart, lte: in2hEnd },
      patientId: { not: null },
    },
    include: { doctor: { include: { profile: true } } },
  })

  for (const appointment of twoHourAppointments) {
    if (!appointment.patientId) continue
    const title = "Nhắc lịch hẹn trong hôm nay"
    if (await alreadySent(appointment.patientId, title, appointment.id)) continue
    await sendNotification({
      recipientId: appointment.patientId,
      appointmentId: appointment.id,
      type: "REMINDER",
      title,
      body: `Lịch hẹn của bạn bắt đầu lúc ${formatAppointmentDate(appointment.appointmentDate, "HH:mm")} hôm nay với BS. ${appointment.doctor.profile?.fullName ?? "Bác sĩ đã ngừng hoạt động"}.`,
    })
  }

  const cancelledInHour = await prisma.appointment.count({
    where: { status: AppointmentStatus.CANCELLED, updatedAt: { gte: oneHourAgo } },
  })
  if (cancelledInHour > 5) {
    await sendToRole("ADMIN", {
      type: "ALERT",
      title: "Cảnh báo hủy lịch bất thường",
      body: `Cảnh báo: ${cancelledInHour} lịch hẹn bị hủy trong 1 giờ qua. Kiểm tra hệ thống.`,
    })
  }

  return {
    pendingWarning: pendingWarning.length,
    timedOut: timedOut.length,
    expiredArrivals: expiredArrivals.length,
    tomorrowReminders: tomorrowAppointments.length,
    twoHourReminders: twoHourAppointments.length,
    cancelledInHour,
  }
}
