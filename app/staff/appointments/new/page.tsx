import { redirect } from "next/navigation"
import { StaffShell } from "@/components/staff/StaffShell"
import { createStaffAppointment } from "@/lib/actions/appointment.actions"
import { getDoctors, getProfilesByRole } from "@/services/clinic.service"
import type { ReactNode } from "react"

export default async function NewStaffAppointmentPage() {
  const [doctors, patients] = await Promise.all([getDoctors(), getProfilesByRole("PATIENT")])

  async function createAction(formData: FormData) {
    "use server"
    const patientId = String(formData.get("patientId") ?? "")
    const date = String(formData.get("date") ?? "")
    const time = String(formData.get("time") ?? "")
    const result = await createStaffAppointment({
      doctorId: String(formData.get("doctorId")),
      appointmentDate: new Date(`${date}T${time}:00+07:00`),
      patientId: patientId === "guest" ? undefined : patientId,
      guestName: String(formData.get("guestName") ?? "") || undefined,
      guestPhone: String(formData.get("guestPhone") ?? "") || undefined,
      guestEmail: String(formData.get("guestEmail") ?? "") || undefined,
      visitReason: String(formData.get("visitReason") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined,
      payAtClinic: formData.get("payAtClinic") === "on",
      paidNow: formData.get("paidNow") === "on",
    })
    redirect(`/staff/appointments/${result.appointment.id}`)
  }

  return (
    <StaffShell title="Đặt lịch hộ" description="Lễ tân tạo lịch cho khách walk-in hoặc bệnh nhân">
      <form
        action={createAction}
        className="max-w-3xl rounded-3xl border border-hairline-muted bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Bác sĩ">
            <select
              name="doctorId"
              required
              className="h-11 w-full rounded-xl border border-hairline px-3"
            >
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bệnh nhân">
            <select
              name="patientId"
              className="h-11 w-full rounded-xl border border-hairline px-3"
              defaultValue="guest"
            >
              <option value="guest">Khách vãng lai</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngày">
            <input
              name="date"
              type="date"
              required
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
          <Field label="Giờ">
            <input
              name="time"
              type="time"
              required
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
          <Field label="Tên khách">
            <input
              name="guestName"
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
          <Field label="SĐT khách">
            <input
              name="guestPhone"
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
          <Field label="Email khách">
            <input
              name="guestEmail"
              type="email"
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
          <Field label="Lý do khám">
            <input
              name="visitReason"
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
        </div>
        <label className="mt-4 block text-sm text-body">
          <span className="mb-1 block font-medium">Ghi chú</span>
          <textarea
            name="notes"
            className="min-h-24 w-full rounded-xl border border-hairline p-3"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-body">
          <label className="inline-flex items-center gap-2">
            <input name="payAtClinic" type="checkbox" /> Thanh toán tại quầy
          </label>
          <label className="inline-flex items-center gap-2">
            <input name="paidNow" type="checkbox" /> Đã thu cọc ngay
          </label>
        </div>
        <button className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          Tạo lịch hẹn
        </button>
      </form>
    </StaffShell>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-body">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  )
}
