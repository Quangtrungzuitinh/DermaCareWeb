"use client"

import { useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { createStaffAppointment } from "@/lib/actions/appointment.actions"
import { PatientSearchSelect, type PatientOption } from "@/components/staff/PatientSearchSelect"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Doctor {
  id: string
  fullName: string
  isActive: boolean
}

interface Props {
  doctors: Doctor[]
  patients: PatientOption[]
}

type PatientType = "GUEST" | "PATIENT"

export function BookOnBehalfDialog({ doctors, patients }: Props) {
  const [open, setOpen] = useState(false)
  const [patientType, setPatientType] = useState<PatientType>("GUEST")
  const [paymentMethod, setPaymentMethod] = useState<"TRANSFER" | "CLINIC">("TRANSFER")
  const [error, setError] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const activeDoctors = doctors.filter((d) => d.isActive)

  function resetForm() {
    setError(null)
    setPatientType("GUEST")
    setPaymentMethod("TRANSFER")
    setSelectedPatient(null)
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) resetForm()
    setOpen(isOpen)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const date = String(fd.get("date") ?? "")
    const time = String(fd.get("time") ?? "")
    const selectedPaymentMethod = String(fd.get("paymentMethod") ?? "TRANSFER")
    if (!date || !time) return
    if (patientType === "PATIENT" && !selectedPatient) {
      setError("Vui lòng chọn bệnh nhân từ danh sách.")
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const result = await createStaffAppointment({
          doctorId: String(fd.get("doctorId")),
          appointmentDate: new Date(`${date}T${time}:00+07:00`),
          patientId:
            patientType === "PATIENT" ? String(fd.get("patientId") ?? "") || undefined : undefined,
          guestName:
            patientType === "GUEST" ? String(fd.get("guestName") ?? "") || undefined : undefined,
          guestPhone:
            patientType === "GUEST" ? String(fd.get("guestPhone") ?? "") || undefined : undefined,
          guestEmail:
            patientType === "GUEST" ? String(fd.get("guestEmail") ?? "") || undefined : undefined,
          visitReason: String(fd.get("visitReason") ?? "") || undefined,
          notes: String(fd.get("notes") ?? "") || undefined,
          payAtClinic: selectedPaymentMethod === "CLINIC",
          paidNow: fd.get("paidNow") === "on",
        })
        handleOpenChange(false)
        router.push(`/staff/appointments?tab=list&appointmentId=${result.appointment.id}`)
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Có lỗi xảy ra"
        if (msg.includes("GUEST_MISSING_INFO")) {
          setError("Khách vãng lai cần có tên và số điện thoại.")
        } else if (msg.includes("SLOT_TAKEN")) {
          setError("Khung giờ này đã có lịch. Vui lòng chọn giờ khác.")
        } else {
          setError(msg)
        }
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
      >
        <Plus className="h-4 w-4" />
        Đặt lịch hộ
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl p-0 shadow-[0_24px_48px_rgba(15,23,42,0.18)]">
          <div className="border-b border-hairline-soft px-6 pb-4 pt-5 pr-12">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-ink">Đặt lịch hộ</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted">
                Lễ tân tạo lịch cho khách walk-in hoặc bệnh nhân đã có tài khoản
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
            <div className="flex w-fit items-center gap-1.5 rounded-full bg-hairline-soft p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setPatientType("GUEST")
                  setSelectedPatient(null)
                }}
                className={`rounded-full px-4 py-1.5 transition ${
                  patientType === "GUEST"
                    ? "bg-white text-ink shadow-sm"
                    : "text-muted hover:text-body"
                }`}
              >
                Khách vãng lai
              </button>
              <button
                type="button"
                onClick={() => setPatientType("PATIENT")}
                className={`rounded-full px-4 py-1.5 transition ${
                  patientType === "PATIENT"
                    ? "bg-white text-ink shadow-sm"
                    : "text-muted hover:text-body"
                }`}
              >
                Bệnh nhân có tài khoản
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Bác sĩ *">
                <select
                  name="doctorId"
                  title="Bác sĩ"
                  required
                  className="h-11 w-full rounded-xl border border-hairline bg-white px-3 text-sm focus:border-primary focus:outline-none"
                >
                  {activeDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
              </Field>

              {patientType === "PATIENT" ? (
                <div className="md:col-span-2">
                  <input type="hidden" name="patientId" value={selectedPatient?.id ?? ""} />
                  <span className="mb-1 block text-sm font-medium text-body">Bệnh nhân *</span>
                  <PatientSearchSelect
                    patients={patients}
                    value={selectedPatient}
                    onChange={setSelectedPatient}
                  />
                </div>
              ) : (
                <>
                  <Field label="Tên khách *">
                    <input
                      name="guestName"
                      required
                      placeholder="Họ và tên"
                      className="h-11 w-full rounded-xl border border-hairline px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </Field>
                  <Field label="SĐT khách *">
                    <input
                      name="guestPhone"
                      required
                      placeholder="0901..."
                      className="h-11 w-full rounded-xl border border-hairline px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </Field>
                  <Field label="Email khách">
                    <input
                      name="guestEmail"
                      type="email"
                      placeholder="(tùy chọn)"
                      className="h-11 w-full rounded-xl border border-hairline px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </Field>
                </>
              )}

              <Field label="Ngày *">
                <input
                  name="date"
                  type="date"
                  title="Ngày khám"
                  required
                  className="h-11 w-full rounded-xl border border-hairline px-3 text-sm focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Giờ *">
                <input
                  name="time"
                  type="time"
                  title="Giờ khám"
                  required
                  className="h-11 w-full rounded-xl border border-hairline px-3 text-sm focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Lý do khám">
                <input
                  name="visitReason"
                  placeholder="(tùy chọn)"
                  className="h-11 w-full rounded-xl border border-hairline px-3 text-sm focus:border-primary focus:outline-none"
                />
              </Field>
            </div>

            <Field label="Ghi chú">
              <textarea
                name="notes"
                rows={3}
                placeholder="(tùy chọn)"
                className="w-full resize-none rounded-xl border border-hairline p-3 text-sm focus:border-primary focus:outline-none"
              />
            </Field>

            <div className="space-y-3">
              <div className="text-sm font-medium text-body">Phương thức thanh toán</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    paymentMethod === "TRANSFER"
                      ? "border-primary bg-[#eff6ff]"
                      : "border-hairline bg-white hover:bg-surface-soft"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="TRANSFER"
                    checked={paymentMethod === "TRANSFER"}
                    onChange={() => setPaymentMethod("TRANSFER")}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-ink">Chuyển khoản / QR</span>
                  <span className="mt-1 block text-xs text-muted">
                    Khách thanh toán cọc qua mã QR.
                  </span>
                </label>
                <label
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    paymentMethod === "CLINIC"
                      ? "border-primary bg-[#eff6ff]"
                      : "border-hairline bg-white hover:bg-surface-soft"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CLINIC"
                    checked={paymentMethod === "CLINIC"}
                    onChange={() => setPaymentMethod("CLINIC")}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-ink">Thanh toán tại quầy</span>
                  <span className="mt-1 block text-xs text-muted">
                    Lễ tân thu cọc trực tiếp tại phòng khám.
                  </span>
                </label>
              </div>

              {paymentMethod === "CLINIC" && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-body">
                  <input name="paidNow" type="checkbox" className="rounded accent-[#2563eb]" />
                  Đã thu cọc ngay
                </label>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 border-t border-hairline-soft pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? "Đang tạo..." : "Tạo lịch hẹn"}
              </button>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="h-11 rounded-full border border-hairline px-5 text-sm font-semibold text-body transition hover:bg-surface-card"
              >
                Huỷ
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
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
