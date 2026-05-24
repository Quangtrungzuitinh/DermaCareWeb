import type { ReactNode } from "react"

import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { ArrowLinkButton } from "@/components/shared/ArrowLinkButton"
import { Initials } from "@/components/shared/InitialsAvatar"
import { PanelCard } from "@/components/shared/PanelCard"
import { formatShortId, getPatientName } from "@/lib/appointment-utils"
import { formatAppointmentDate } from "@/lib/format"
import type { UiAppointment } from "@/services/clinic.types"

type Column = {
  key: string
  label: string
  render: (appointment: UiAppointment) => ReactNode
}

type Props = {
  appointments: UiAppointment[]
  title: string
  subtitle: string
  linkTo: string
  linkLabel: string
  columns: Column[]
  minWidth?: number
  className?: string
  rowLimit?: number
  onOpenAppointment?: (appointment: UiAppointment) => void
  linkSearch?: Record<string, string>
}

export function AppointmentOverviewTable({
  appointments,
  title,
  subtitle,
  linkTo,
  linkLabel,
  columns,
  minWidth = 640,
  className,
  rowLimit,
  onOpenAppointment,
  linkSearch,
}: Props) {
  const visibleAppointments = rowLimit ? appointments.slice(0, rowLimit) : appointments

  return (
    <PanelCard className={className}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        <ArrowLinkButton to={linkTo} search={linkSearch} label={linkLabel} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="bg-surface-soft text-left text-[11px] uppercase tracking-wider text-muted-soft">
              <th className="py-3.5 pl-5 pr-3 font-semibold">Mã</th>
              <th className="px-3 py-3.5 font-semibold">Bệnh nhân</th>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-3.5 font-semibold">
                  {column.label}
                </th>
              ))}
              <th className="py-3.5 pl-3 pr-5 font-semibold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3} className="py-10 text-center text-muted">
                  Chưa có lịch nào
                </td>
              </tr>
            ) : (
              visibleAppointments.map((appointment) => (
                <TableRow
                  key={appointment.id}
                  appointment={appointment}
                  columns={columns}
                  onOpenAppointment={onOpenAppointment}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </PanelCard>
  )
}

function TableRow({
  appointment,
  columns,
  onOpenAppointment,
}: {
  appointment: UiAppointment
  columns: Column[]
  onOpenAppointment?: (appointment: UiAppointment) => void
}) {
  if (onOpenAppointment) {
    return (
      <tr
        onClick={() => onOpenAppointment(appointment)}
        className="cursor-pointer transition-colors hover:bg-surface-soft"
      >
        <AppointmentRowCells appointment={appointment} columns={columns} />
      </tr>
    )
  }

  return (
    <tr className="transition-colors hover:bg-surface-soft">
      <AppointmentRowCells appointment={appointment} columns={columns} />
    </tr>
  )
}

function AppointmentRowCells({
  appointment,
  columns,
}: {
  appointment: UiAppointment
  columns: Column[]
}) {
  return (
    <>
                  <td className="py-4 pl-5 pr-3">
                    <div className="font-semibold text-ink">#{formatShortId(appointment.id)}</div>
                    <div className="mt-0.5 text-xs text-muted-soft">Lịch hẹn</div>
                  </td>
                  <td className="px-3 py-4">
                    <PatientCell appointment={appointment} />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-4">
                      {column.render(appointment)}
                    </td>
                  ))}
                  <td className="py-4 pl-3 pr-5">
                    <AppointmentStatusBadge status={appointment.status} />
                  </td>
    </>
  )
}

export function AppointmentTimeCell({
  appointment,
  format = "HH:mm",
  detail,
}: {
  appointment: UiAppointment
  format?: string
  detail?: ReactNode
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-ink">
        {formatAppointmentDate(appointment.appointmentDate, format)}
      </div>
      {detail && <div className="mt-0.5 text-xs text-muted">{detail}</div>}
    </div>
  )
}

function PatientCell({ appointment }: { appointment: UiAppointment }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Initials name={getPatientName(appointment)} size={32} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-ink">{getPatientName(appointment)}</div>
        <div className="truncate text-xs text-muted">
          {appointment.patient?.phone ?? appointment.guestPhone ?? "Chưa có SĐT"}
        </div>
      </div>
    </div>
  )
}
