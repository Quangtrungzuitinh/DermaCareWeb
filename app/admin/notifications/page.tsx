import { AdminShell } from "@/components/admin/AdminShell"
import { NotificationCenterClient } from "@/components/notifications/NotificationCenterClient"
import { NotificationSummaryCards } from "@/components/notifications/NotificationSummaryCards"
import { requireRole } from "@/lib/auth/require-role"
import { getAllNotifications } from "@/services/notification.service"
import { getProfilesByRole, getStaffAppointments } from "@/services/clinic.service"

export default async function AdminNotificationsPage() {
  const { profile } = await requireRole(["ADMIN"])
  const [notifications, recipients, appointments] = await Promise.all([
    getAllNotifications(),
    getProfilesByRole(),
    getStaffAppointments(),
  ])

  return (
    <AdminShell
      title="Thông báo"
      description="Broadcast, gửi trực tiếp, xem và thu hồi thông báo"
      profileName={profile.fullName}
    >
      <div className="space-y-5">
        <NotificationSummaryCards notifications={notifications} revokedLabel="Đã thu hồi" />
        <NotificationCenterClient
          mode="ADMIN"
          notifications={notifications}
          recipients={recipients}
          appointments={appointments}
        />
      </div>
    </AdminShell>
  )
}
