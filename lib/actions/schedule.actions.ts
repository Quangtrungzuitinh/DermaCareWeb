"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/require-role"
import type { DayOfWeek } from "@/lib/generated/prisma"

async function requireAdmin() {
  await requireRole(["ADMIN"])
}

export async function saveWeeklyRules(
  doctorId: string,
  rules: {
    dayOfWeek: DayOfWeek
    startMinute: number
    endMinute: number
    slotDuration: number
    maxPatients: number
    isActive: boolean
  }[],
) {
  await requireAdmin()
  await prisma.$transaction([
    prisma.doctorScheduleRule.deleteMany({ where: { doctorId } }),
    prisma.doctorScheduleRule.createMany({
      data: rules.map((rule) => ({ ...rule, doctorId })),
    }),
  ])
  revalidatePath("/admin")
  revalidatePath("/admin/doctors")
}

export async function addBlockedSlot(input: {
  doctorId: string
  dateStr: string
  startMinute: number
  endMinute: number
  reason?: string
}) {
  await requireAdmin()
  const slot = await prisma.doctorBlockedSlot.create({
    data: {
      doctorId: input.doctorId,
      blockedDate: new Date(`${input.dateStr}T00:00:00+07:00`),
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      reason: input.reason || null,
      isActive: true,
    },
  })
  revalidatePath("/admin")
  return slot
}

export async function toggleBlockedSlot(id: string, isActive: boolean) {
  await requireAdmin()
  const slot = await prisma.doctorBlockedSlot.update({ where: { id }, data: { isActive } })
  revalidatePath("/admin")
  return slot
}

export async function deactivateBlockedSlot(id: string) {
  return toggleBlockedSlot(id, false)
}

export async function getConfirmedAppointmentsOnDate(doctorId: string, dateStr: string) {
  await requireAdmin()
  const start = new Date(`${dateStr}T00:00:00+07:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return prisma.appointment.count({
    where: {
      doctorId,
      status: "CONFIRMED",
      appointmentDate: { gte: start, lt: end },
    },
  })
}
