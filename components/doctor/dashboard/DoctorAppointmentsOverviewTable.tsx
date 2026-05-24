"use client"

import {
  AppointmentOverviewTable,
  AppointmentTimeCell,
} from "@/components/shared/appointments/AppointmentOverviewTable"
import { TOP_SERVICES_LIMIT } from "@/lib/constants"
import type { UiAppointment } from "@/services/clinic.types"

export function DoctorAppointmentsOverviewTable({
  appointments,
  onOpenAppointment,
}: {
  appointments: UiAppointment[]
  onOpenAppointment: (appointment: UiAppointment) => void
}) {
  return (
    <AppointmentOverviewTable
      appointments={appointments}
      title="Lịch hẹn tổng quan"
      subtitle={`${appointments.length} lịch hẹn`}
      linkTo="/doctor/appointments"
      linkSearch={{ tab: "list" }}
      linkLabel="Mở lịch hẹn"
      minWidth={720}
      className="md:col-span-2"
      rowLimit={TOP_SERVICES_LIMIT}
      onOpenAppointment={onOpenAppointment}
      columns={[
        {
          key: "visit",
          label: "Lịch khám",
          render: (appointment) => (
            <AppointmentTimeCell
              appointment={appointment}
              format="HH:mm dd/MM/yyyy"
              detail={appointment.visitReason ?? appointment.notes ?? "Chưa ghi lý do khám"}
            />
          ),
        },
        {
          key: "clinical",
          label: "Y lệnh",
          render: (appointment) => <ClinicalBadge appointment={appointment} />,
        },
      ]}
    />
  )
}

function ClinicalBadge({ appointment }: { appointment: UiAppointment }) {
  const state = getClinicalState(appointment)
  if (state === "draft") {
    return (
      <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
        Draft
      </span>
    )
  }
  if (state === "ready") {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        Đang khám
      </span>
    )
  }
  if (state === "done") {
    return (
      <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
        Đã chốt
      </span>
    )
  }
  return (
    <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">
      Chưa có
    </span>
  )
}

function getClinicalState(appointment: UiAppointment) {
  if (appointment.status === "COMPLETED") return "done"
  if (!appointment.medicalRecord || appointment.status !== "CONFIRMED") return "none"
  return new Date(appointment.appointmentDate).getTime() > Date.now() ? "draft" : "ready"
}
