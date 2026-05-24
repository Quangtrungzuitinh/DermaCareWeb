import { StaffShell } from "@/components/staff/StaffShell"
import { NotificationCenterClient } from "@/components/notifications/NotificationCenterClient"
import { NotificationSummaryCards } from "@/components/notifications/NotificationSummaryCards"
import { requireRole } from "@/lib/auth/require-role"
import { getProfilesByRole, getStaffAppointments } from "@/services/clinic.service"
import { getMyNotifications } from "@/services/notification.service"

export default async function StaffNotificationsPage() {
  const { profile } = await requireRole(["STAFF"])
  const [notifications, patients, doctors, appointments] = await Promise.all([
    getMyNotifications(),
    getProfilesByRole("PATIENT"),
    getProfilesByRole("DOCTOR"),
    getStaffAppointments(),
  ])

  return (
    <StaffShell
      title="Thông báo"
      description="Gửi thông báo nghiệp vụ và theo dõi thông báo của lễ tân"
      profileName={profile.fullName}
      profileEmail={profile.email ?? undefined}
    >
      <div className="space-y-5">
        <NotificationSummaryCards
          notifications={notifications}
          totalLabel="Thông báo của tôi"
          linkedLabel="Có gắn lịch"
        />
        <NotificationCenterClient
          mode="STAFF"
          notifications={notifications}
          recipients={[...patients, ...doctors]}
          appointments={appointments}
        />
      </div>
    </StaffShell>
  )
}
