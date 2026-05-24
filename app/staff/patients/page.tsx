import { StaffShell } from "@/components/staff/StaffShell"
import { getStaffPatients } from "@/services/clinic.service"
import { StaffPatientsClient } from "./StaffPatientsClient"

export default async function StaffPatientsPage() {
  const { patients, appointments } = await getStaffPatients()

  return (
    <StaffShell title="Bệnh nhân" description={`${patients.length} hồ sơ`}>
      <StaffPatientsClient patients={patients} appointments={appointments} />
    </StaffShell>
  )
}
