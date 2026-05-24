"use client"

import {
  CalendarDays,
  Check,
  Clock,
  Mail,
  Pencil,
  Phone,
  Receipt,
  Stethoscope,
  User,
} from "lucide-react"
import {
  EditField,
  formatVNDate,
  ReadField,
  Section,
  SummaryRow,
} from "@/components/booking/BookingConfirmFields"
import { Initials } from "@/components/shared/InitialsAvatar"
import { formatVND } from "@/lib/format"
import type { ConfirmDoctor, PaymentMethod } from "@/types/booking"

const PAYMENT_OPTIONS: {
  id: PaymentMethod
  name: string
  desc: string
  tintClass: string
}[] = [
  { id: "vietqr", name: "Chuyển khoản", desc: "VietQR mọi ngân hàng", tintClass: "text-ink" },
  { id: "momo", name: "Ví MoMo", desc: "Quét QR ví MoMo", tintClass: "text-pink-700" },
  { id: "zalopay", name: "ZaloPay", desc: "Quét QR ZaloPay", tintClass: "text-blue-600" },
]

export function PatientInfoSection({
  editing,
  patientEmail,
  patientName,
  patientPhone,
  onEditingChange,
  onPatientEmailChange,
  onPatientNameChange,
  onPatientPhoneChange,
}: {
  editing: boolean
  patientEmail: string
  patientName: string
  patientPhone: string
  onEditingChange: (editing: boolean) => void
  onPatientEmailChange: (value: string) => void
  onPatientNameChange: (value: string) => void
  onPatientPhoneChange: (value: string) => void
}) {
  return (
    <Section
      title="Thông tin bệnh nhân"
      action={
        !editing ? (
          <button
            type="button"
            onClick={() => onEditingChange(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary bg-white px-3.5 text-xs font-bold text-primary hover:bg-blue-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Sửa
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onEditingChange(false)}
            className="h-9 rounded-lg bg-primary px-3.5 text-xs font-bold text-white hover:bg-primary-hover"
          >
            Lưu
          </button>
        )
      }
    >
      {editing ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <EditField label="Họ tên" value={patientName} onChange={onPatientNameChange} />
          <EditField
            label="Email"
            value={patientEmail}
            onChange={onPatientEmailChange}
            type="email"
          />
          <EditField label="Số điện thoại" value={patientPhone} onChange={onPatientPhoneChange} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ReadField icon={User} label="Họ tên" value={patientName || "Chưa có"} />
          <ReadField icon={Mail} label="Email" value={patientEmail || "Chưa có"} />
          <ReadField icon={Phone} label="Số điện thoại" value={patientPhone || "Chưa có"} />
        </div>
      )}
    </Section>
  )
}

export function AppointmentInfoSection({
  doctor,
  mode,
  serviceName,
  date,
  slot,
  onEdit,
}: {
  doctor: ConfirmDoctor
  mode: string
  serviceName: string
  date: string
  slot: string
  onEdit: () => void
}) {
  return (
    <Section
      title="Thông tin lịch khám"
      action={
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary bg-white px-3.5 text-xs font-bold text-primary hover:bg-blue-50"
        >
          <Pencil className="h-3.5 w-3.5" /> Sửa
        </button>
      }
    >
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <Initials name={doctor.fullName} size={52} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-ink">BS. {doctor.fullName}</div>
          <div className="truncate text-xs text-muted">{doctor.specialty ?? "Da liễu"}</div>
        </div>
        <span className="rounded-md border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-bold text-primary">
          {serviceName}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ReadField icon={CalendarDays} label="Ngày khám" value={formatVNDate(date)} />
        <ReadField icon={Clock} label="Giờ khám" value={slot} />
        <ReadField
          icon={Stethoscope}
          label="Phương thức"
          value={mode === "service" ? "Theo dịch vụ" : "Theo bác sĩ"}
        />
      </div>
    </Section>
  )
}

export function NoteSection({ note }: { note: string }) {
  if (!note) return null

  return (
    <Section title="Triệu chứng mô tả">
      <div className="rounded-xl border border-hairline bg-surface-soft p-4 text-sm leading-relaxed text-body">
        {note}
      </div>
    </Section>
  )
}

export function PaymentMethodSection({
  paymentMethod,
  onPaymentMethodChange,
}: {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (value: PaymentMethod) => void
}) {
  return (
    <Section title="Phương thức thanh toán">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {PAYMENT_OPTIONS.map((option) => {
          const selected = paymentMethod === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onPaymentMethodChange(option.id)}
              className={`relative rounded-2xl border-2 p-3.5 text-left transition ${
                selected
                  ? "border-primary bg-blue-50"
                  : "border-hairline bg-white hover:border-blue-200"
              }`}
            >
              {selected && (
                <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
              )}
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-hairline-soft bg-white font-black ${option.tintClass}`}
              >
                {option.name.slice(0, 2)}
              </div>
              <div className="text-sm font-bold text-ink">{option.name}</div>
              <div className="mt-0.5 text-[11px] text-muted">{option.desc}</div>
            </button>
          )
        })}
      </div>
    </Section>
  )
}

export function PaymentSummary({
  deposit,
  examFee,
  remaining,
  serviceName,
}: {
  deposit: number
  examFee: number
  remaining: number
  serviceName: string
}) {
  return (
    <aside className="rounded-3xl border border-hairline bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-ink">Tóm tắt thanh toán</h2>
      </div>
      <div className="space-y-3 rounded-2xl bg-surface-soft p-4 text-sm">
        <SummaryRow label="Dịch vụ" value={serviceName} />
        <SummaryRow label="Phí khám" value={formatVND(examFee)} />
        <SummaryRow label="Đặt cọc" value={formatVND(deposit)} strong />
        <SummaryRow label="Thanh toán tại phòng khám" value={formatVND(remaining)} />
      </div>
    </aside>
  )
}
