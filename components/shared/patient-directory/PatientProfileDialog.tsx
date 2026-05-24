"use client"

import { useMemo } from "react"
import Link from "next/link"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatAppointmentDate } from "@/lib/format"
import type { UiAppointment, UiProfile } from "@/services/clinic.types"

export function PatientProfileDialog({
  patient,
  appointments,
  actionHref,
  actionLabel,
  onOpenChange,
  onSelectAppointment,
}: {
  patient: UiProfile | null
  appointments: UiAppointment[]
  actionHref: string
  actionLabel: string
  onOpenChange: (open: boolean) => void
  onSelectAppointment: (appointment: UiAppointment) => void
}) {
  const rows = useMemo(() => {
    if (!patient) return []
    return appointments
      .filter((appointment) => appointment.patient?.id === patient.id)
      .sort((a, b) => +new Date(b.appointmentDate) - +new Date(a.appointmentDate))
  }, [appointments, patient])

  return (
    <Dialog open={Boolean(patient)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-hairline-muted p-0 sm:max-w-4xl">
        {patient && (
          <>
            <div className="border-b border-hairline-muted px-6 py-5">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="pr-8 text-xl font-bold text-ink">
                  {patient.fullName}
                </DialogTitle>
                <DialogDescription className="text-muted">Hồ sơ bệnh nhân</DialogDescription>
              </DialogHeader>
            </div>

            <div className="grid gap-5 px-6 py-5 lg:grid-cols-[280px_1fr]">
              <aside className="space-y-4">
                <div className="rounded-2xl border border-hairline-muted p-4">
                  <div className="text-sm font-semibold text-ink">Thông tin cá nhân</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <ProfileRow label="Email" value={patient.email ?? "—"} />
                    <ProfileRow label="SĐT" value={patient.phone ?? "—"} />
                    <ProfileRow
                      label="Năm sinh"
                      value={patient.birthYear ? String(patient.birthYear) : "—"}
                    />
                    <ProfileRow
                      label="Khu vực"
                      value={[patient.district, patient.province].filter(Boolean).join(", ") || "—"}
                    />
                  </div>
                </div>
                <Link
                  href={actionHref}
                  className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  {actionLabel}
                </Link>
              </aside>

              <section className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-ink">Lịch sử lịch hẹn</h3>
                  <span className="rounded-full bg-surface-card px-2.5 py-1 text-xs font-semibold text-body">
                    {rows.length} lịch
                  </span>
                </div>
                <div className="space-y-2">
                  {rows.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => onSelectAppointment(appointment)}
                      className="block w-full rounded-2xl border border-hairline-muted px-4 py-3 text-left transition-colors hover:bg-surface-soft"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-ink">
                            {formatAppointmentDate(appointment.appointmentDate, "dd/MM/yyyy HH:mm")}
                          </div>
                          <div className="truncate text-xs text-muted">
                            {appointment.doctor.fullName}
                          </div>
                        </div>
                        <AppointmentStatusBadge status={appointment.status} />
                      </div>
                    </button>
                  ))}
                  {rows.length === 0 && (
                    <div className="rounded-2xl bg-surface-soft p-6 text-sm text-muted">
                      Chưa có lịch hẹn.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  )
}
