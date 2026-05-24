import type { AppointmentStatus } from "@/lib/generated/prisma"
import type { UiAppointment } from "@/services/clinic.types"
import type { SortOption } from "@/components/shared/SortButton"

export type AppointmentListFilter = "all" | "upcoming" | "pending" | "history"
export type AppointmentListSort = "date_desc" | "date_asc" | "status" | "patient"

export const APPOINTMENT_SORT_OPTIONS: SortOption<AppointmentListSort>[] = [
  { value: "date_desc", label: "Mới nhất" },
  { value: "date_asc", label: "Cũ nhất" },
  { value: "status", label: "Trạng thái" },
  { value: "patient", label: "Tên bệnh nhân" },
]

const STATUS_SORT_ORDER: Record<AppointmentStatus, number> = {
  PENDING_PAYMENT: 0,
  CONFIRMED: 1,
  CHECKED_IN: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  NO_SHOW: 5,
}

type AppointmentListModelInput = {
  appointments: UiAppointment[]
  filter: AppointmentListFilter
  query: string
  sort: AppointmentListSort
  now: number
}

export function buildAppointmentListModel({
  appointments,
  filter,
  query,
  sort,
  now,
}: AppointmentListModelInput) {
  const normalizedQuery = query.trim().toLowerCase()
  const matchesSearch = (appointment: UiAppointment) => {
    if (!normalizedQuery) return true

    const patientName = appointment.patient?.fullName ?? appointment.guestName ?? ""
    return (
      patientName.toLowerCase().includes(normalizedQuery) ||
      appointment.doctor.fullName.toLowerCase().includes(normalizedQuery)
    )
  }

  const all = appointments.filter(matchesSearch)
  const upcoming = appointments.filter(
    (appointment) =>
      appointment.status === "CONFIRMED" &&
      +new Date(appointment.appointmentDate) > now &&
      matchesSearch(appointment),
  )
  const pending = appointments.filter(
    (appointment) => appointment.status === "PENDING_PAYMENT" && matchesSearch(appointment),
  )
  const history = appointments.filter(
    (appointment) =>
      ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status) &&
      matchesSearch(appointment),
  )

  const filteredRows =
    filter === "upcoming"
      ? upcoming
      : filter === "pending"
        ? pending
        : filter === "history"
          ? history
          : all

  return {
    filterPills: [
      { id: "all", label: "Tất cả", count: all.length },
      { id: "upcoming", label: "Sắp tới", count: upcoming.length },
      { id: "pending", label: "Chờ thanh toán", count: pending.length },
      { id: "history", label: "Lịch sử", count: history.length },
    ] satisfies { id: AppointmentListFilter; label: string; count: number }[],
    rows: [...filteredRows].sort((first, second) => compareAppointments(first, second, sort)),
  }
}

function compareAppointments(
  first: UiAppointment,
  second: UiAppointment,
  sort: AppointmentListSort,
) {
  if (sort === "date_asc") {
    return +new Date(first.appointmentDate) - +new Date(second.appointmentDate)
  }

  if (sort === "status") {
    const statusDiff = STATUS_SORT_ORDER[first.status] - STATUS_SORT_ORDER[second.status]
    if (statusDiff !== 0) return statusDiff
    return +new Date(second.appointmentDate) - +new Date(first.appointmentDate)
  }

  if (sort === "patient") {
    const patientNameDiff = (first.patient?.fullName ?? first.guestName ?? "").localeCompare(
      second.patient?.fullName ?? second.guestName ?? "",
      "vi",
    )
    if (patientNameDiff !== 0) return patientNameDiff
  }

  return +new Date(second.appointmentDate) - +new Date(first.appointmentDate)
}
