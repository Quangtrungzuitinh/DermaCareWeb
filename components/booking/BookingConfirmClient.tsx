"use client"

import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { BookingLayout } from "@/components/booking/BookingLayout"
import {
  AppointmentInfoSection,
  NoteSection,
  PatientInfoSection,
  PaymentMethodSection,
  PaymentSummary,
} from "@/components/booking/BookingConfirmParts"
import { useBookingConfirmState } from "@/hooks/useBookingConfirmState"
import { formatVND } from "@/lib/format"
import type { ConfirmDoctor, ConfirmProfile, ConfirmService } from "@/types/booking"

export function BookingConfirmClient({
  doctor,
  service,
  profile,
  date,
  slot,
  mode,
  note,
  selectPath,
  paymentBasePath,
}: {
  doctor: ConfirmDoctor
  service: ConfirmService
  profile: ConfirmProfile
  date: string
  slot: string
  mode: string
  note: string
  selectPath: string
  paymentBasePath: string
}) {
  const router = useRouter()
  const {
    agreed,
    setAgreed,
    editing,
    setEditing,
    paymentMethod,
    setPaymentMethod,
    error,
    patientName,
    setPatientName,
    patientPhone,
    setPatientPhone,
    patientEmail,
    setPatientEmail,
    canConfirm,
    isPending,
    handleConfirm,
    deposit,
  } = useBookingConfirmState({ profile, doctorId: doctor.id, date, slot, note, paymentBasePath })

  const serviceName = service?.name ?? "Khám tổng quát da liễu"
  const examFee = service?.price ?? 300000
  const remaining = Math.max(examFee - deposit, 0)

  return (
    <BookingLayout current={2}>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_380px]">
        <main className="rounded-3xl border border-hairline bg-white p-6 sm:p-8">
          <div className="mb-7">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              DermaCare · Xác nhận
            </div>
            <h1 className="mt-1 text-[22px] font-black leading-tight text-ink">
              Hoàn tất thông tin đặt lịch
            </h1>
          </div>

          <PatientInfoSection
            editing={editing}
            patientEmail={patientEmail}
            patientName={patientName}
            patientPhone={patientPhone}
            onEditingChange={setEditing}
            onPatientEmailChange={setPatientEmail}
            onPatientNameChange={setPatientName}
            onPatientPhoneChange={setPatientPhone}
          />

          <AppointmentInfoSection
            doctor={doctor}
            mode={mode}
            serviceName={serviceName}
            date={date}
            slot={slot}
            onEdit={() => router.push(selectPath)}
          />

          <NoteSection note={note} />

          <PaymentMethodSection
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
          />

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
              {error}
            </div>
          )}

          <label className="mb-4 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <span className="text-xs leading-relaxed text-muted">
              Tôi đồng ý với điều khoản đặt lịch, chính sách hủy lịch và cho phép DermaCare
              lưu trữ hồ sơ y tế liên quan đến lần khám này.
            </span>
          </label>

          <button
            type="button"
            disabled={!canConfirm || isPending}
            onClick={handleConfirm}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-[15px] font-bold text-white shadow-card transition hover:bg-primary-hover disabled:bg-surface-strong disabled:text-muted-soft disabled:shadow-none"
          >
            {isPending ? "Đang tạo lịch..." : `Tiếp tục thanh toán ${formatVND(deposit)}`}
            {!isPending && <ArrowRight className="h-4 w-4" />}
          </button>
        </main>

        <PaymentSummary
          deposit={deposit}
          examFee={examFee}
          remaining={remaining}
          serviceName={serviceName}
        />
      </div>
    </BookingLayout>
  )
}
