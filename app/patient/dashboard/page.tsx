import { PatientDashboardClient } from "./PatientDashboardClient"
import { PatientProfileMissingState } from "@/components/patient/PatientProfileMissingState"
import { getPatientDashboardData, PatientProfileNotFoundError } from "@/services/patient.service"

export default async function PatientDashboardPage() {
  try {
    const data = await getPatientDashboardData()
    return <PatientDashboardClient data={data} />
  } catch (error) {
    if (error instanceof PatientProfileNotFoundError) {
      return <PatientProfileMissingState />
    }

    throw error
  }
}
