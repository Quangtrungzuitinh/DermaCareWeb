import { PatientShell } from "@/components/patient/PatientShell"
import { NotificationCenterClient } from "@/components/notifications/NotificationCenterClient"
import { NotificationSummaryCards } from "@/components/notifications/NotificationSummaryCards"
import { requireRole } from "@/lib/auth/require-role"
import { getMyNotifications } from "@/services/notification.service"

export default async function PatientNotificationsPage() {
  const { profile } = await requireRole(["PATIENT"])
  const notifications = await getMyNotifications()

  return (
    <PatientShell
      title="Thông báo"
      description="Theo dõi lịch hẹn, thanh toán và nhắc lịch"
      profile={{ fullName: profile.fullName, email: profile.email }}
    >
      <div className="space-y-5">
        <NotificationSummaryCards notifications={notifications} />
        <NotificationCenterClient mode="READONLY" notifications={notifications} />
      </div>
    </PatientShell>
  )
}
