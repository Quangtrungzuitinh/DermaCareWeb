// lib/actions/slot.actions.ts
"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

// Map từ getDay() JavaScript (0=Sun) sang Prisma DayOfWeek enum
const DAY_MAP: Record<number, "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT"> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
}

export async function getAvailableSlots(doctorId: string, date: Date) {
  const dayOfWeek = DAY_MAP[date.getDay()]

  // Lấy TẤT CẢ lịch làm việc chuẩn của bác sĩ hôm đó
  const rules = await prisma.doctorScheduleRule.findMany({
    where: { doctorId, dayOfWeek, isActive: true },
    orderBy: { startMinute: "asc" },
  })
  if (rules.length === 0) return [] // Bác sĩ không làm ngày này

  // Lấy slot bị khóa đột xuất — BẮT BUỘC isActive: true (fix Issue C4)
  const blocked = await prisma.doctorBlockedSlot.findMany({
    where: {
      doctorId,
      blockedDate: { gte: startOfDay(date), lte: endOfDay(date) },
      isActive: true,
    },
  })

  // Lấy các slot đã có appointment (không kể CANCELLED)
  const taken = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: { gte: startOfDay(date), lte: endOfDay(date) },
      status: { notIn: ["CANCELLED"] },
    },
    select: { appointmentDate: true },
  })

  // Chia block thời gian từ mỗi rule theo slotDuration
  const slots: Date[] = []
  for (const rule of rules) {
    let minute = rule.startMinute
    while (minute + rule.slotDuration <= rule.endMinute) {
      const slotTime = new Date(date)
      slotTime.setHours(Math.floor(minute / 60), minute % 60, 0, 0)
      slots.push(slotTime)
      minute += rule.slotDuration
    }
  }

  // Lọc: bỏ slot bị blocked hoặc đã taken
  return slots.filter((slot) => {
    const slotMin = slot.getHours() * 60 + slot.getMinutes()

    const isBlocked = blocked.some((b) => slotMin >= b.startMinute && slotMin < b.endMinute)
    const isTaken = taken.some(
      (a) => Math.abs(a.appointmentDate.getTime() - slot.getTime()) < 60_000,
    )

    return !isBlocked && !isTaken
  })
}
