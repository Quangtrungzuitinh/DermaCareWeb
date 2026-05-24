import "server-only"

import { addDays, format, isSameMinute, parse } from "date-fns"
import { createAppointment } from "@/lib/actions/appointment.actions"
import { getAvailableSlots } from "@/lib/actions/slot.actions"
import { formatAppointmentDate } from "@/lib/format"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

type SlotOption = {
  doctorId: string
  doctorName: string
  doctorSpecialty: string | null
  appointmentDate: string
}

type BookingContext = {
  mode?: "booking"
  serviceId?: string
  serviceName?: string
  doctorId?: string
  doctorName?: string
  selectedDate?: string
  appointmentDate?: string
  visitReason?: string
  guestName?: string
  guestPhone?: string
  lastSlotOptions?: SlotOption[]
}

type ChatSessionRow = {
  id: string
  context: unknown
}

type ChatAction = {
  label: string
  href: string
}

const bookingIntentPatterns = [
  "đặt lịch",
  "dat lich",
  "book",
  "booking",
  "hẹn khám",
  "hen kham",
  "đặt hẹn",
  "dat hen",
  "đặt khám",
  "dat kham",
  "lịch khám",
  "lich kham",
  "đăng ký khám",
  "dang ky kham",
  "muốn khám",
  "muon kham",
  "muốn đặt",
  "muon dat",
  "khám bác sĩ",
  "kham bac si",
  "khám mụn",
  "khám da",
]
const confirmPatterns = ["xác nhận", "đồng ý", "ok", "oke", "đặt luôn", "chốt"]
const PAYMENT_TIMEOUT_MINUTES = 15

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseContext(value: unknown): BookingContext {
  return isRecord(value) ? (value as BookingContext) : {}
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFC")
}

function hasAny(message: string, patterns: string[]) {
  const normalized = normalize(message)
  return patterns.some((pattern) => normalized.includes(normalize(pattern)))
}

export function isBookingMessage(message: string, context?: unknown) {
  const parsed = parseContext(context)
  return parsed.mode === "booking" || hasAny(message, bookingIntentPatterns)
}

export async function shouldHandleBookingChat(message: string, sessionId: string | null) {
  if (hasAny(message, bookingIntentPatterns)) return true
  if (!sessionId) return false

  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { context: true },
  })

  return isBookingMessage(message, session?.context)
}

function isConfirmMessage(message: string) {
  return hasAny(message, confirmPatterns)
}

function parsePreferredDate(message: string) {
  const normalized = normalize(message)
  const today = new Date()

  if (normalized.includes("ngày kia")) return addDays(today, 2)
  if (normalized.includes("mai") || normalized.includes("tomorrow")) return addDays(today, 1)

  const iso = normalized.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (iso) return parse(iso[1]!, "yyyy-MM-dd", today)

  const slash = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/)
  if (slash) {
    const year = slash[3] ?? String(today.getFullYear())
    return parse(`${slash[1]}/${slash[2]}/${year}`, "d/M/yyyy", today)
  }

  return null
}

function parseTime(message: string) {
  const normalized = normalize(message)
  const match =
    normalized.match(/\b(\d{1,2})(?::|h)(\d{2})?\b/) ??
    normalized.match(/\b(\d{1,2})\s*(?:giờ|gio)\s*(\d{1,2})?\b/)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2] ?? "0")
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null

  return { hour, minute }
}

function preferredDayPart(message: string) {
  const normalized = normalize(message)
  if (normalized.includes("chiều")) return "afternoon"
  if (normalized.includes("sáng")) return "morning"
  return null
}

function hasTimePreference(message: string) {
  return Boolean(parseTime(message) || preferredDayPart(message))
}

async function replyWithSlotOptions(message: string, context: BookingContext) {
  const options = await findSlotOptions(message, context)
  context.lastSlotOptions = options

  return options.length
    ? `Tôi tìm thấy các khung giờ trống cho ngày ${selectedDateLabel(context)}:\n${formatSlotOptions(options)}\nBạn muốn chọn khung nào? Hãy trả lời số thứ tự hoặc giờ khám.`
    : "Tôi chưa tìm thấy slot trống phù hợp cho ngày/giờ này. Bạn muốn chọn giờ khác hoặc ngày khác không?"
}

function selectedDateLabel(context: BookingContext) {
  if (!context.selectedDate) return null
  return formatAppointmentDate(`${context.selectedDate}T00:00:00.000Z`, "dd/MM/yyyy")
}

async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, fullName: true, phone: true, role: true },
  })
}

async function getOrCreateSession(
  sessionId: string | null,
  userId?: string | null,
): Promise<ChatSessionRow> {
  if (sessionId) {
    const existing = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, context: true },
    })
    if (existing) return existing
  }

  return prisma.chatSession.create({
    data: { userId: userId ?? null, role: "PATIENT", context: { mode: "booking" } },
    select: { id: true, context: true },
  })
}

async function findService(message: string, existingServiceId?: string) {
  if (existingServiceId) {
    const existing = await prisma.service.findFirst({
      where: { id: existingServiceId, isActive: true },
    })
    if (existing) return existing
  }

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })
  const normalized = normalize(message)

  if (normalized.includes("mụn")) {
    const acneService = services.find((service) => {
      const text = normalize(`${service.name} ${service.description ?? ""}`)
      return text.includes("mụn") || text.includes("acne")
    })
    if (acneService) return acneService
  }

  const matched = services.find((service) => {
    const text = normalize(`${service.name} ${service.description ?? ""}`)
    return text.split(/\s+/).some((word) => word.length >= 3 && normalized.includes(word))
  })

  if (matched) return matched

  return (
    services.find(
      (service) =>
        normalize(service.name).includes("consultation") ||
        normalize(service.name).includes("khám"),
    ) ??
    services[0] ??
    null
  )
}

async function getActiveDoctors() {
  const rows = await prisma.doctorProfile.findMany({
    where: { isActive: true, approvalStatus: "APPROVED" },
    include: { profile: true },
    orderBy: { createdAt: "asc" },
  })

  return rows.filter((doctor) => doctor.profile)
}

function pickSlotFromMessage(message: string, options: SlotOption[] = []) {
  const indexMatch = normalize(message).match(/(?:số|slot|khung)?\s*(\d+)/)
  if (indexMatch) {
    const index = Number(indexMatch[1]) - 1
    if (options[index]) return options[index]
  }

  const parsedTime = parseTime(message)
  if (!parsedTime) return null

  return (
    options.find((option) => {
      const date = new Date(option.appointmentDate)
      return date.getHours() === parsedTime.hour && date.getMinutes() === parsedTime.minute
    }) ?? null
  )
}

async function findSlotOptions(message: string, context: BookingContext) {
  const doctors = context.doctorId
    ? (await getActiveDoctors()).filter((doctor) => doctor.id === context.doctorId)
    : await getActiveDoctors()
  const targetDate = context.selectedDate
    ? parse(context.selectedDate, "yyyy-MM-dd", new Date())
    : parsePreferredDate(message)
  if (!targetDate) return []

  const dayPart = preferredDayPart(message)
  const parsedTime = parseTime(message)
  const options: SlotOption[] = []

  for (const doctor of doctors) {
    const slots = await getAvailableSlots(doctor.id, targetDate)
    const filtered = slots.filter((slot) => {
      if (parsedTime)
        return slot.getHours() === parsedTime.hour && slot.getMinutes() === parsedTime.minute
      if (dayPart === "morning") return slot.getHours() < 12
      if (dayPart === "afternoon") return slot.getHours() >= 12
      return true
    })

    for (const slot of filtered.slice(0, 3)) {
      options.push({
        doctorId: doctor.id,
        doctorName: doctor.profile ? `BS. ${doctor.profile.fullName}` : "Bác sĩ",
        doctorSpecialty: doctor.specialty,
        appointmentDate: slot.toISOString(),
      })
    }
  }

  return options
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
    .slice(0, 5)
}

function formatSlotOptions(options: SlotOption[]) {
  return options
    .map(
      (option, index) =>
        `${index + 1}. ${formatAppointmentDate(option.appointmentDate, "HH:mm dd/MM/yyyy")} với ${option.doctorName}${
          option.doctorSpecialty ? ` (${option.doctorSpecialty})` : ""
        }`,
    )
    .join("\n")
}

function summary(context: BookingContext) {
  return [
    context.serviceName ? `Dịch vụ: ${context.serviceName}` : null,
    context.doctorName ? `Bác sĩ: ${context.doctorName}` : null,
    !context.appointmentDate && context.selectedDate
      ? `Ngày khám: ${selectedDateLabel(context)}`
      : null,
    context.appointmentDate
      ? `Thời gian: ${formatAppointmentDate(context.appointmentDate, "HH:mm dd/MM/yyyy")}`
      : null,
    context.guestName ? `Họ tên: ${context.guestName}` : null,
    context.guestPhone ? `SĐT: ${context.guestPhone}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

async function validateSelectedSlot(context: BookingContext) {
  if (!context.doctorId || !context.appointmentDate) return false
  const available = await getAvailableSlots(context.doctorId, new Date(context.appointmentDate))
  return available.some((slot) => isSameMinute(slot, new Date(context.appointmentDate!)))
}

async function createBooking(context: BookingContext, hasProfile: boolean) {
  if (!context.doctorId || !context.appointmentDate) {
    return { ok: false, reply: "Tôi cần bác sĩ và khung giờ trước khi đặt lịch." }
  }

  if (!hasProfile) {
    return {
      ok: false,
      action: { label: "Đăng nhập", href: "/auth/login" } satisfies ChatAction,
      reply:
        "Tính năng đặt lịch qua chatbot chỉ dành cho người dùng đã đăng nhập. Hãy đăng nhập tài khoản bệnh nhân để sử dụng tính năng đặt lịch.",
    }
  }

  if (!(await validateSelectedSlot(context))) {
    return {
      ok: false,
      reply:
        "Khung giờ này vừa thay đổi hoặc không còn trống. Bạn vui lòng chọn lại khung giờ khác.",
    }
  }

  const result = await createAppointment({
    doctorId: context.doctorId,
    appointmentDate: new Date(context.appointmentDate),
    guestName: hasProfile ? undefined : context.guestName,
    guestPhone: hasProfile ? undefined : context.guestPhone,
    visitReason: context.visitReason ?? context.serviceName ?? "Đặt lịch qua chatbot",
    notes: context.serviceName
      ? `Chatbot booking service: ${context.serviceName}`
      : "Chatbot booking",
  })

  const paymentPath = hasProfile
    ? `/patient/booking/payment/${result.appointment.id}`
    : `/booking/payment/${result.appointment.id}`

  return {
    ok: true,
    appointmentId: result.appointment.id,
    action: {
      label: "Thanh toán ngay",
      href: paymentPath,
    } satisfies ChatAction,
    reply: `Đã tạo lịch hẹn thành công.\nMã lịch hẹn: ${result.appointment.id.slice(-8).toUpperCase()}\n${summary(context)}\nVui lòng hoàn tất thanh toán cọc trong ${PAYMENT_TIMEOUT_MINUTES} phút để xác nhận lịch. Sau khi thanh toán được xác nhận, hệ thống sẽ gửi thông báo cho bạn.`,
  }
}

export async function handleBookingChat(message: string, sessionId: string | null) {
  const profile = await getCurrentProfile()
  if (!profile) {
    return {
      reply:
        "Tính năng đặt lịch qua chatbot chỉ dành cho người dùng đã đăng nhập. Hãy đăng nhập tài khoản bệnh nhân để sử dụng tính năng đặt lịch.",
      action: { label: "Đăng nhập", href: "/auth/login" },
    }
  }

  const session = await getOrCreateSession(sessionId, profile?.id)
  const context: BookingContext = { ...parseContext(session.context), mode: "booking" }

  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "user", content: message },
  })

  const service = await findService(message, context.serviceId)
  if (service) {
    context.serviceId = service.id
    context.serviceName = service.name
    context.visitReason = context.visitReason ?? service.name
  }

  const pickedSlot = pickSlotFromMessage(message, context.lastSlotOptions)
  if (pickedSlot) {
    context.doctorId = pickedSlot.doctorId
    context.doctorName = pickedSlot.doctorName
    context.appointmentDate = pickedSlot.appointmentDate
  }

  let reply: string
  let action: ChatAction | undefined

  if (isConfirmMessage(message)) {
    const result = await createBooking(context, Boolean(profile))
    reply = result.reply
    action = result.ok ? result.action : undefined
    if (result.ok) {
      context.lastSlotOptions = []
    }
  } else if (!context.selectedDate) {
    const selectedDate = parsePreferredDate(message)
    if (selectedDate) {
      context.selectedDate = format(selectedDate, "yyyy-MM-dd")
      context.lastSlotOptions = []
      reply = hasTimePreference(message)
        ? await replyWithSlotOptions(message, context)
        : `Tôi đã ghi nhận ngày khám ${selectedDateLabel(context)}. Bạn muốn khám buổi sáng, buổi chiều hay giờ cụ thể nào?`
    } else {
      reply = "Bạn muốn đặt lịch ngày nào? Ví dụ: ngày mai, 25/05 hoặc 2026-05-25."
    }
  } else if (
    !context.appointmentDate &&
    context.lastSlotOptions?.length &&
    !hasTimePreference(message)
  ) {
    reply = `Tôi đang có các khung giờ trống cho ngày ${selectedDateLabel(context)}:\n${formatSlotOptions(
      context.lastSlotOptions,
    )}\nBạn muốn chọn khung nào? Hãy trả lời số thứ tự hoặc giờ khám.`
  } else if (!context.appointmentDate) {
    if (!hasTimePreference(message)) {
      reply = `Bạn muốn khám ngày ${selectedDateLabel(context)} vào buổi sáng, buổi chiều hay giờ cụ thể nào?`
    } else {
      reply = await replyWithSlotOptions(message, context)
    }
  } else {
    reply = `Vui lòng kiểm tra lại thông tin:\n${summary(context)}\nNếu đúng, hãy trả lời "xác nhận" để tôi tạo lịch hẹn.`
  }

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { context },
  })
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "assistant", content: reply },
  })

  return { reply, sessionId: session.id, action }
}
