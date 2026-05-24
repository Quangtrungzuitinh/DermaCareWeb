import { formatInTimeZone } from "date-fns-tz"
import { TZ } from "@/lib/format"
import { ONE_DAY_MS, DASHBOARD_WEEK_DAYS } from "@/lib/constants"
import type { AppointmentStatus } from "@/lib/generated/prisma"

const STATUS_ORDER: AppointmentStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]

export function buildStatusStats<T extends { status: AppointmentStatus }>(
  appointments: T[],
): { status: AppointmentStatus; count: number }[] {
  return STATUS_ORDER.map((status) => ({
    status,
    count: appointments.filter((a) => a.status === status).length,
  }))
}

export function buildDailyStats<T extends { appointmentDate: string }>(
  appointments: T[],
  now: Date,
  getValue: (dayAppointments: T[]) => number,
) {
  return Array.from({ length: DASHBOARD_WEEK_DAYS }, (_, index) => {
    const date = new Date(now.getTime() - (DASHBOARD_WEEK_DAYS - 1 - index) * ONE_DAY_MS)
    const key = formatInTimeZone(date, TZ, "yyyy-MM-dd")
    const dayAppointments = appointments.filter(
      (a) => formatInTimeZone(new Date(a.appointmentDate), TZ, "yyyy-MM-dd") === key,
    )
    return { date, count: dayAppointments.length, value: getValue(dayAppointments) }
  })
}

export function buildWeekAppointments<T extends { appointmentDate: string }>(
  appointments: T[],
  now: Date,
): T[] {
  const sevenDaysAgo = new Date(now.getTime() - (DASHBOARD_WEEK_DAYS - 1) * ONE_DAY_MS)
  const tomorrow = new Date(now.getTime() + ONE_DAY_MS)
  return appointments.filter((a) => {
    const d = new Date(a.appointmentDate)
    return d >= sevenDaysAgo && d <= tomorrow
  })
}

export function buildDashboardWindow<
  T extends {
    appointmentDate: string
    status: AppointmentStatus
    baseFee: number
    payment?: { amount: number } | null
    patient?: { id: string } | null
    guestPhone?: string | null
    guestName?: string | null
    id: string
  },
>(appointments: T[], now: Date) {
  const todayKey = formatInTimeZone(now, TZ, "yyyy-MM-dd")
  const from = new Date(now.getTime() - (DASHBOARD_WEEK_DAYS - 1) * ONE_DAY_MS)
  const updateLabel = `Cập nhật ${formatInTimeZone(now, TZ, "dd/MM/yyyy")}`
  const weekAppointments = buildWeekAppointments(appointments, now)
  const todayAppointments = appointments
    .filter((appointment) => {
      return formatInTimeZone(new Date(appointment.appointmentDate), TZ, "yyyy-MM-dd") === todayKey
    })
    .sort((a, b) => +new Date(a.appointmentDate) - +new Date(b.appointmentDate))
  const completedWeek = weekAppointments.filter((appointment) => appointment.status === "COMPLETED")

  return {
    from,
    updateLabel,
    weekAppointments,
    todayAppointments,
    completedCount: completedWeek.length,
    weekRevenue: completedWeek.reduce(
      (sum, appointment) => sum + (appointment.payment?.amount ?? appointment.baseFee),
      0,
    ),
    uniquePatients: new Set(
      weekAppointments.map(
        (appointment) =>
          appointment.patient?.id ??
          appointment.guestPhone ??
          appointment.guestName ??
          appointment.id,
      ),
    ).size,
  }
}
