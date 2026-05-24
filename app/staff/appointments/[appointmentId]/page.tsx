import { notFound, redirect } from "next/navigation"
import { manualConfirmPayment } from "@/lib/actions/payment.actions"
import {
  cancelAppointment,
  linkGuestAppointmentToPatient,
  updateAppointmentStatus,
} from "@/lib/actions/appointment.actions"
import { checkInPatient } from "@/lib/actions/encounter.actions"
import { StaffShell } from "@/components/staff/StaffShell"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { StaffAppointmentActionsClient } from "./StaffAppointmentActionsClient"
import { getStaffAppointment } from "@/services/clinic.service"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import { AppointmentStatus } from "@/lib/generated/prisma"

export default async function StaffAppointmentDetailPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = await params
  const appointment = await getStaffAppointment(appointmentId)
  if (!appointment) notFound()
  const baseFee = appointment.baseFee

  async function confirmAction() {
    "use server"
    await manualConfirmPayment(appointmentId, baseFee)
  }

  async function cancelAction(reason: string) {
    "use server"
    await cancelAppointment(appointmentId, reason)
    redirect("/staff/appointments")
  }

  async function checkInAction() {
    "use server"
    await checkInPatient(appointmentId)
  }

  async function noShowAction() {
    "use server"
    await updateAppointmentStatus(appointmentId, AppointmentStatus.NO_SHOW)
    redirect("/staff/appointments")
  }

  async function linkGuestAction(identifier: string) {
    "use server"
    return linkGuestAppointmentToPatient(appointmentId, identifier)
  }

  return (
    <StaffShell
      title="Chi tiết lịch hẹn"
      description={formatAppointmentDate(appointment.appointmentDate, "EEE, dd/MM/yyyy HH:mm")}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-3xl border border-hairline-muted bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-ink">
                {appointment.patient?.fullName ?? appointment.guestName ?? "Khách vãng lai"}
              </h2>
              <p className="text-sm text-muted">
                {appointment.guestPhone ?? appointment.patient?.phone ?? "Chưa có SĐT"}
              </p>
            </div>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Bác sĩ" value={appointment.doctor.fullName} />
            <Info
              label="Thời gian"
              value={formatAppointmentDate(appointment.appointmentDate, "dd/MM/yyyy HH:mm")}
            />
            <Info
              label="Lý do khám"
              value={appointment.visitReason ?? appointment.notes ?? "Chưa ghi nhận"}
            />
            <Info label="Cọc phí" value={formatVND(appointment.baseFee)} />
          </div>
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-ink">Hồ sơ bệnh án</h3>
            {appointment.medicalRecord ? (
              <div className="rounded-2xl bg-surface-soft p-4 text-sm text-body">
                <div>Chẩn đoán: {appointment.medicalRecord.diagnosis ?? "Chưa cập nhật"}</div>
                <div className="mt-1">
                  Ghi chú: {appointment.medicalRecord.notes ?? "Chưa cập nhật"}
                </div>
                <div className="mt-3 space-y-1">
                  {appointment.medicalRecord.treatments.map((t) => (
                    <div key={t.id} className="flex justify-between">
                      <span>
                        {t.serviceName} x{t.quantity}
                      </span>
                      <span>{formatVND(t.priceAtTime * t.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-soft p-4 text-sm text-muted">
                Hồ sơ sẽ được tạo sau khi xác nhận cọc.
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-hairline-muted bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <StaffAppointmentActionsClient
            status={appointment.status}
            payment={
              appointment.payment
                ? {
                    amount: appointment.payment.amount,
                    confirmedAt: appointment.payment.confirmedAt
                      ? formatAppointmentDate(appointment.payment.confirmedAt, "dd/MM/yyyy HH:mm")
                      : null,
                  }
                : null
            }
            baseFee={appointment.baseFee}
            confirmAction={confirmAction}
            checkInAction={checkInAction}
            cancelAction={cancelAction}
            noShowAction={noShowAction}
            linkGuestAction={linkGuestAction}
            canLinkGuest={!appointment.patient}
            defaultGuestIdentifier={appointment.guestPhone ?? appointment.guestEmail ?? ""}
          />
        </aside>
      </div>
    </StaffShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  )
}
