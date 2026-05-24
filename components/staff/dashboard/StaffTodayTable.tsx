import {
  AppointmentOverviewTable,
  AppointmentTimeCell,
} from "@/components/shared/appointments/AppointmentOverviewTable"
import type { UiAppointment } from "@/services/clinic.types"

export function StaffTodayTable({ appointments }: { appointments: UiAppointment[] }) {
  return (
    <AppointmentOverviewTable
      appointments={appointments}
      title="Lịch hôm nay"
      subtitle={`${appointments.length} cuộc hẹn`}
      linkTo="/staff/appointments"
      linkLabel="Mở lịch hẹn"
      columns={[
        {
          key: "visit",
          label: "Lịch khám",
          render: (appointment) => (
            <AppointmentTimeCell appointment={appointment} detail={appointment.doctor.fullName} />
          ),
        },
      ]}
    />
  )
}
