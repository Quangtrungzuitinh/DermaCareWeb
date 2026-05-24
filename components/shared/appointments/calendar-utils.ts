import type { AppointmentStatus } from "@/lib/generated/prisma"
import { getAppointmentStatusPalette } from "@/lib/appointment-status"
import type { UiAppointment } from "@/services/clinic.types"

export function pal(status: AppointmentStatus) {
  return getAppointmentStatusPalette(status)
}

export function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function getInitialCalendarDate(appointments: UiAppointment[]) {
  const visible = appointments
    .filter((a) => !["CANCELLED", "NO_SHOW"].includes(a.status))
    .map((a) => new Date(a.appointmentDate))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())

  const now = Date.now()
  return visible.find((d) => d.getTime() >= now) ?? visible[0] ?? new Date()
}
