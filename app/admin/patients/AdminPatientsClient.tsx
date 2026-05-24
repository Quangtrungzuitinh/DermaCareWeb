"use client"

import { PatientDirectoryClient } from "@/components/shared/PatientDirectoryClient"
import type { UiAppointment, UiProfile } from "@/services/clinic.types"

interface Props {
  patients: UiProfile[]
  appointments: UiAppointment[]
}

export function AdminPatientsClient({ patients, appointments }: Props) {
  return (
    <PatientDirectoryClient
      patients={patients}
      appointments={appointments}
      profileActionHref="/admin/appointments?tab=list"
      profileActionLabel="Xem lịch hẹn"
    />
  )
}
