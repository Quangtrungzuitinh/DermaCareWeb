import type { UiAppointment } from "@/services/clinic.types"

export function getPatientVisits(patientId: string, appointments: UiAppointment[]) {
  return appointments
    .filter((appointment) => appointment.patient?.id === patientId)
    .sort((a, b) => +new Date(b.appointmentDate) - +new Date(a.appointmentDate))
}
