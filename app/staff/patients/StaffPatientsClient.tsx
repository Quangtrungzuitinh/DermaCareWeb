"use client"

import { PatientDirectoryClient } from "@/components/shared/PatientDirectoryClient"
import type { UiAppointment, UiProfile } from "@/services/clinic.types"

interface Props {
  patients: UiProfile[]
  appointments: UiAppointment[]
}

export function StaffPatientsClient({ patients, appointments }: Props) {
  return (
    <PatientDirectoryClient
      patients={patients}
      appointments={appointments}
      profileActionHref="/staff/appointments/new"
      profileActionLabel="Đặt lịch mới"
    />
  )
}
