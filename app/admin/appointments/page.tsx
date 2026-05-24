import { Suspense } from "react"
import { AdminShell } from "@/components/admin/AdminShell"
import { AppointmentsView } from "@/components/shared/AppointmentsView"
import { getStaffAppointments } from "@/services/clinic.service"
import { requireRole } from "@/lib/auth/require-role"

export default async function AdminAppointmentsPage() {
  const { profile } = await requireRole(["ADMIN"])
  const all = await getStaffAppointments()

  return (
    <AdminShell
      title="Lịch hẹn"
      description={`${all.length} lịch hẹn trong hệ thống`}
      profileName={profile.fullName}
    >
      <Suspense>
        <AppointmentsView
          appointments={all}
          detailBasePath="/admin/appointments"
          detailNavigation="dialog"
        />
      </Suspense>
    </AdminShell>
  )
}
