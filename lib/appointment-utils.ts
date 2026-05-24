type PatientNameSource = {
  patient?: { fullName?: string | null } | null
  medicalRecord?: { guestSnapshotName?: string | null } | null
  guestName?: string | null
}

export function getPatientName(appointment: PatientNameSource): string {
  return (
    appointment.patient?.fullName ??
    appointment.medicalRecord?.guestSnapshotName ??
    appointment.guestName ??
    "Khách vãng lai"
  )
}

export function formatShortId(id: string): string {
  const normalized = id.replace(/^appointment_/, "APT-")
  return normalized.length > 14 ? normalized.slice(-10).toUpperCase() : normalized.toUpperCase()
}
