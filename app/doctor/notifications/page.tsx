import { DoctorShell } from "@/components/doctor/DoctorShell"
import { NotificationCenterClient } from "@/components/notifications/NotificationCenterClient"
import { NotificationSummaryCards } from "@/components/notifications/NotificationSummaryCards"
import { requireRole } from "@/lib/auth/require-role"
import { getMyNotifications } from "@/services/notification.service"

export default async function DoctorNotificationsPage() {
  const { profile } = await requireRole(["DOCTOR"])
  const notifications = await getMyNotifications()

  return (
    <DoctorShell
      title="Thông báo"
      description="Bác sĩ chỉ nhận thông báo, không gửi thủ công"
      profileName={profile.fullName}
      profileEmail={profile.email ?? undefined}
    >
      <div className="space-y-5">
        <NotificationSummaryCards notifications={notifications} />
        <NotificationCenterClient mode="READONLY" notifications={notifications} />
      </div>
    </DoctorShell>
  )
}
