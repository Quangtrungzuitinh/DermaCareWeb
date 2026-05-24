import { Bell } from "lucide-react"

import { InsightCard } from "@/components/shared/InsightCard"
import type { UiNotification } from "@/services/clinic.types"

export function NotificationSummaryCards({
  notifications,
  totalLabel = "Tổng thông báo",
  linkedLabel = "Liên quan lịch hẹn",
  revokedLabel,
}: {
  notifications: UiNotification[]
  totalLabel?: string
  linkedLabel?: string
  revokedLabel?: string
}) {
  const unreadCount = notifications.filter((item) => !item.isRead && !item.revokedAt).length
  const thirdValue = revokedLabel
    ? notifications.filter((item) => item.revokedAt).length
    : notifications.filter((item) => item.appointmentId).length

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <InsightCard icon={Bell} label={totalLabel} value={String(notifications.length)} />
      <InsightCard icon={Bell} label="Chưa đọc" value={String(unreadCount)} tone="amber" />
      <InsightCard
        icon={Bell}
        label={revokedLabel ?? linkedLabel}
        value={String(thirdValue)}
        tone="slate"
      />
    </div>
  )
}
