"use client"

import { ListPagination } from "@/components/shared/ListPagination"
import { AppointmentDetailDialog } from "@/components/shared/AppointmentsView"
import { PatientDirectoryTable } from "@/components/shared/patient-directory/PatientDirectoryTable"
import { PatientDirectoryToolbar } from "@/components/shared/patient-directory/PatientDirectoryToolbar"
import { PatientProfileDialog } from "@/components/shared/patient-directory/PatientProfileDialog"
import { usePatientDirectoryState } from "@/components/shared/patient-directory/usePatientDirectoryState"
import type { UiAppointment, UiProfile } from "@/services/clinic.types"

interface Props {
  patients: UiProfile[]
  appointments: UiAppointment[]
  profileActionHref: string
  profileActionLabel: string
}

export function PatientDirectoryClient({
  patients,
  appointments,
  profileActionHref,
  profileActionLabel,
}: Props) {
  const directory = usePatientDirectoryState({ patients, appointments })

  return (
    <>
      <PatientDirectoryToolbar
        query={directory.query}
        sort={directory.sort}
        onQueryChange={directory.setQuery}
        onSortChange={directory.setSort}
      />

      <PatientDirectoryTable
        appointments={appointments}
        patients={directory.pageRows}
        query={directory.query}
        total={directory.filtered.length}
        onSelectPatient={directory.setSelectedPatient}
      />

      {directory.filtered.length > 0 && (
        <ListPagination
          total={directory.filtered.length}
          page={directory.page}
          pageSize={directory.pageSize}
          onPageChange={directory.setPage}
          onPageSizeChange={directory.setPageSize}
          itemLabel="bệnh nhân"
        />
      )}

      <PatientProfileDialog
        patient={directory.selectedPatient}
        appointments={appointments}
        actionHref={profileActionHref}
        actionLabel={profileActionLabel}
        onOpenChange={(open) => {
          if (!open) directory.setSelectedPatient(null)
        }}
        onSelectAppointment={directory.setSelectedAppointment}
      />
      <AppointmentDetailDialog
        appointment={directory.selectedAppointment}
        onOpenChange={(open) => {
          if (!open) directory.setSelectedAppointment(null)
        }}
      />
    </>
  )
}
