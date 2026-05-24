import type { WaitlistStatus } from "@/lib/generated/prisma"

const BADGE_STYLES: Record<WaitlistStatus, { bg: string; text: string; label: string }> = {
  WAITING: { bg: "#fefce8", text: "#854d0e", label: "Đang chờ" },
  NOTIFIED: { bg: "#eff6ff", text: "#1d4ed8", label: "Đã thông báo" },
  BOOKED: { bg: "#f0fdf4", text: "#166534", label: "Đã đặt lịch" },
  EXPIRED: { bg: "#f8fafc", text: "#475569", label: "Hết hạn" },
  CANCELLED: { bg: "#fef2f2", text: "#991b1b", label: "Đã hủy" },
}

export function WaitlistStatusBadge({ status }: { status: WaitlistStatus }) {
  const style = BADGE_STYLES[status]

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}
