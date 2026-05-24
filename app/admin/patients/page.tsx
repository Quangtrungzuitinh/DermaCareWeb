import { AdminShell } from "@/components/admin/AdminShell"
import { requireRole } from "@/lib/auth/require-role"
import { getStaffPatients } from "@/services/clinic.service"
import { AdminPatientsClient } from "./AdminPatientsClient"

export default async function AdminPatientsPage() {
  const { profile } = await requireRole(["ADMIN"])
  const { patients, appointments } = await getStaffPatients()

  return (
    <AdminShell
      title="Bệnh nhân"
      description={`${patients.length} hồ sơ bệnh nhân trong hệ thống`}
      profileName={profile.fullName}
    >
      <AdminPatientsClient patients={patients} appointments={appointments} />
    </AdminShell>
  )
}
