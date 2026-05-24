import { PatientHealthRecordsClient } from "./PatientHealthRecordsClient"
import { PatientProfileMissingState } from "@/components/patient/PatientProfileMissingState"
import { healthRecordService, PatientProfileNotFoundError } from "@/services/patient.service"

export default async function PatientHealthRecordsPage() {
  try {
    const [summary, records, prescriptions, documents, progress] = await Promise.all([
      healthRecordService.getMyHealthSummary(),
      healthRecordService.getMyMedicalRecords(),
      healthRecordService.getMyPrescriptions(),
      healthRecordService.getMyMedicalDocuments(),
      healthRecordService.getMyProgress(),
    ])

    return (
      <PatientHealthRecordsClient
        summary={summary}
        records={records}
        prescriptions={prescriptions}
        documents={documents}
        progress={progress}
      />
    )
  } catch (error) {
    if (error instanceof PatientProfileNotFoundError) {
      return <PatientProfileMissingState />
    }

    throw error
  }
}
