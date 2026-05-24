import { formatInTimeZone } from "date-fns-tz"

export const TZ = "Asia/Ho_Chi_Minh"

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatAppointmentDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return formatInTimeZone(d, TZ, pattern)
}

export function ymd(date: Date): string {
  return formatInTimeZone(date, TZ, "yyyy-MM-dd")
}
