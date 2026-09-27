import type { DoctorProfile, Profile } from "@/lib/generated/prisma"
import type { SlotItem } from "@/types/booking"

export type DoctorWithProfile = DoctorProfile & {
  profile: Profile
  expertiseLabels?: Array<{ modelCode: string; labelEn: string; labelVi: string }>
  serviceAssignments?: Array<{ service: { id: string; name: string; description: string | null } }>
}
export type PatientSummary = { fullName: string; email: string | null; phone: string | null } | null
export type SlotGroup = { date: string; label: string; slots: SlotItem[] }

export const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
export const MONTHS_VI = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
]
export const DAY_FULL = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

export function toISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function fromISO(value: string) {
  return new Date(`${value}T00:00:00`)
}

export function formatDDMMYYYY(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
}

export function availableCount(date: Date) {
  if (date.getDay() === 0) return 0
  const seed = (date.getDate() * 13 + date.getMonth() * 7 + date.getFullYear()) % 11
  return Math.max(0, Math.min(15, seed + 4))
}

export function eachDayBetween(startISO: string, endISO: string) {
  const start = fromISO(startISO)
  const end = fromISO(endISO)
  const first = start <= end ? start : end
  const last = start <= end ? end : start
  const days: string[] = []
  const cursor = new Date(first)

  while (cursor <= last && days.length < 31) {
    days.push(toISO(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function toSlotItem(slotDate: Date): SlotItem {
  const date = new Date(slotDate)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const startMinute = hours * 60 + minutes
  const endMinute = startMinute + 30
  const startLabel = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  const endLabel = `${String(Math.floor(endMinute / 60)).padStart(2, "0")}:${String(endMinute % 60).padStart(2, "0")}`

  return {
    label: `${startLabel} - ${endLabel}`,
    startMinute,
    endMinute,
    available: true,
  }
}
