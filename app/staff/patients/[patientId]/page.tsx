import { notFound } from "next/navigation"
import Link from "next/link"
import { StaffShell } from "@/components/staff/StaffShell"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { getStaffPatients } from "@/services/clinic.service"
import { formatAppointmentDate } from "@/lib/format"

export default async function StaffPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  const { patients, appointments } = await getStaffPatients()
  const patient = patients.find((p) => p.id === patientId)
  if (!patient) notFound()
  const rows = appointments.filter((a) => a.patient?.id === patient.id)

  return (
    <StaffShell title={patient.fullName} description="Hồ sơ bệnh nhân">
      <div className="grid gap-5 lg:grid-cols-3">
        <aside className="rounded-3xl border border-hairline-muted bg-white p-6">
          <h2 className="text-xl font-bold text-ink">{patient.fullName}</h2>
          <div className="mt-4 space-y-2 text-sm text-body">
            <div>Email: {patient.email ?? "—"}</div>
            <div>SĐT: {patient.phone ?? "—"}</div>
            <div>Năm sinh: {patient.birthYear ?? "—"}</div>
            <div>
              Khu vực: {[patient.district, patient.province].filter(Boolean).join(", ") || "—"}
            </div>
          </div>
          <Link
            href="/staff/appointments/new"
            className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Đặt lịch mới
          </Link>
        </aside>
        <section className="lg:col-span-2 rounded-3xl border border-hairline-muted bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">Lịch sử lịch hẹn</h3>
          <div className="space-y-2">
            {rows.map((a) => (
              <Link
                key={a.id}
                href={`/staff/appointments/${a.id}`}
                className="block rounded-2xl border border-hairline-muted px-4 py-3 hover:bg-surface-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {formatAppointmentDate(a.appointmentDate, "dd/MM/yyyy HH:mm")}
                    </div>
                    <div className="text-xs text-muted">{a.doctor.fullName}</div>
                  </div>
                  <AppointmentStatusBadge status={a.status} />
                </div>
              </Link>
            ))}
            {rows.length === 0 && (
              <div className="rounded-2xl bg-surface-soft p-6 text-sm text-muted">
                Chưa có lịch hẹn.
              </div>
            )}
          </div>
        </section>
      </div>
    </StaffShell>
  )
}
