import type { AppointmentStatus } from "@/lib/generated/prisma"

export type AppointmentStatusPalette = {
  bg: string
  border: string
  text: string
  ring: string
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã check-in",
  PENDING_PAYMENT: "Chờ thanh toán",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
}

export const APPOINTMENT_STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-50 text-yellow-800",
  CONFIRMED: "bg-green-50 text-green-800",
  CHECKED_IN: "bg-cyan-50 text-cyan-800",
  COMPLETED: "bg-blue-50 text-primary-hover",
  CANCELLED: "bg-red-50 text-red-800",
  NO_SHOW: "bg-slate-50 text-slate-600",
}

export const APPOINTMENT_STATUS_PALETTES: Record<AppointmentStatus, AppointmentStatusPalette> = {
  CONFIRMED: { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a", ring: "#60a5fa" },
  CHECKED_IN: { bg: "#cffafe", border: "#06b6d4", text: "#155e75", ring: "#22d3ee" },
  PENDING_PAYMENT: { bg: "#fef3c7", border: "#f59e0b", text: "#78350f", ring: "#fbbf24" },
  COMPLETED: { bg: "#dcfce7", border: "#22c55e", text: "#14532d", ring: "#4ade80" },
  CANCELLED: { bg: "#fee2e2", border: "#ef4444", text: "#7f1d1d", ring: "#f87171" },
  NO_SHOW: { bg: "#f1f5f9", border: "#64748b", text: "#334155", ring: "#94a3b8" },
}

export const APPOINTMENT_STATUS_LEGEND = [
  { status: "CONFIRMED" as AppointmentStatus, label: APPOINTMENT_STATUS_LABELS.CONFIRMED },
  {
    status: "PENDING_PAYMENT" as AppointmentStatus,
    label: APPOINTMENT_STATUS_LABELS.PENDING_PAYMENT,
  },
  { status: "CHECKED_IN" as AppointmentStatus, label: APPOINTMENT_STATUS_LABELS.CHECKED_IN },
  { status: "COMPLETED" as AppointmentStatus, label: APPOINTMENT_STATUS_LABELS.COMPLETED },
]

export function getAppointmentStatusPalette(status: AppointmentStatus) {
  return APPOINTMENT_STATUS_PALETTES[status] ?? APPOINTMENT_STATUS_PALETTES.CONFIRMED
}
