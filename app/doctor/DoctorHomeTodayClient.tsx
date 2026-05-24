"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DoctorAppointmentsOverviewTable } from "@/components/doctor/dashboard/DoctorAppointmentsOverviewTable"
import { DoctorTodayAppointmentsPanel } from "@/components/doctor/dashboard/DoctorTodayAppointmentsPanel"
import { AppointmentDetailDialog } from "@/components/shared/AppointmentsView"
import { ymd } from "@/lib/format"
import type { UiAppointment, UiService } from "@/services/clinic.types"

export function DoctorHomeTodayClient({
  today,
  appointments,
  services,
}: {
  today: string
  appointments: UiAppointment[]
  services: UiService[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<UiAppointment | null>(null)
  const todayDate = new Date(today)
  const [selectedDate, setSelectedDate] = useState(() => ymd(todayDate))
  const selectedAppointments = appointments
    .filter((appointment) => ymd(new Date(appointment.appointmentDate)) === selectedDate)
    .sort((a, b) => +new Date(a.appointmentDate) - +new Date(b.appointmentDate))
  const overviewAppointments = appointments
    .slice()
    .sort((a, b) => +new Date(b.appointmentDate) - +new Date(a.appointmentDate))

  return (
    <>
      <DoctorTodayAppointmentsPanel
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        appointments={selectedAppointments}
        onSelect={setSelected}
      />
      <DoctorAppointmentsOverviewTable
        appointments={overviewAppointments}
        onOpenAppointment={(appointment) => {
          router.push(`/doctor/appointments?tab=list&appointmentId=${appointment.id}`)
        }}
      />

      <AppointmentDetailDialog
        appointment={selected}
        allowActions={false}
        allowClinicalActions
        allowPresenceConfirmation
        clinicalServices={services}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}
