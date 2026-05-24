import { PatientShell } from "@/components/patient/PatientShell"
import { PatientDoctorsClient } from "@/app/patient/doctors/PatientDoctorsClient"
import { getDoctors, getServices } from "@/services/clinic.service"
import { appointmentService } from "@/services/patient.service"

export default async function PatientDoctorsPage() {
  const [doctors, appointments, services] = await Promise.all([
    getDoctors(),
    appointmentService.getMyAppointments().catch(() => []),
    getServices(false),
  ])
  const visitedIds = new Set(appointments.map((appointment) => appointment.doctor.id))

  return (
    <PatientShell title="Bác sĩ của tôi" description="Quản lý các bác sĩ bạn đã, đang và sẽ khám">
      <PatientDoctorsClient
        doctors={doctors}
        services={services}
        visitedDoctorIds={Array.from(visitedIds)}
      />
    </PatientShell>
  )
}
