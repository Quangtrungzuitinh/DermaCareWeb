import {
  AppointmentOverviewTable,
  AppointmentTimeCell,
} from "@/components/shared/appointments/AppointmentOverviewTable"
import type { UiAppointment } from "@/services/clinic.types"

export function TodayAppointmentsTable({ appointments }: { appointments: UiAppointment[] }) {
  return (
    <AppointmentOverviewTable
      appointments={appointments}
      title="Lịch hôm nay"
      subtitle={`${appointments.length} cuộc hẹn`}
      linkTo="/admin/appointments"
      linkSearch={{ tab: "list" }}
      linkLabel="Mở lịch hẹn"
      columns={[
        {
          key: "doctor",
          label: "Bác sĩ",
          render: (appointment) => (
            <span className="text-sm font-semibold text-ink">{appointment.doctor.fullName}</span>
          ),
        },
        {
          key: "time",
          label: "Giờ",
          render: (appointment) => <AppointmentTimeCell appointment={appointment} />,
        },
      ]}
    />
  )
}
