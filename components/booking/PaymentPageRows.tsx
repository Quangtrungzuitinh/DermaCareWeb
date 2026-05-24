import { Copy } from "lucide-react"

import { formatVND } from "@/lib/format"
import type { PaymentAppointment } from "@/components/booking/PaymentPagePanels"

export function PaymentSummary({
  appointment,
  amount,
}: {
  appointment: PaymentAppointment
  amount: number
}) {
  return (
    <aside className="min-w-0 rounded-[32px] border border-[#e2e8f0] bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] sm:p-6 xl:sticky xl:top-24 xl:self-start">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2563eb]">
            Thông tin lịch hẹn
          </div>
          <h2 className="mt-1 text-lg font-black text-[#0f172a]">Tóm tắt đặt lịch</h2>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-xs font-black text-[#2563eb]">
          #{appointment.id.slice(-2).toUpperCase()}
        </span>
      </div>

      <div className="mb-5 rounded-[24px] border border-[#e2e8f0] bg-[#f7f9fc] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#854d0e]">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#f59e0b]" />
          Đang chờ xác nhận thanh toán
        </div>
      </div>

      <div className="space-y-3">
        <SummaryRow label="Mã lịch" value={appointment.id.slice(-8).toUpperCase()} />
        <SummaryRow label="Bác sĩ" value={appointment.doctorName ?? "DermaCare"} />
        <SummaryRow label="Ngày giờ" value={appointment.appointmentDate ?? "Đang cập nhật"} />
        <SummaryRow label="Đặt cọc" value={formatVND(amount)} strong />
      </div>
    </aside>
  )
}

export function BankRow({
  label,
  value,
  mono = false,
  highlight = false,
  onCopy,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
  onCopy?: () => void
}) {
  return (
    <div className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-4 border-b border-[#e2e8f0] py-3.5 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)]">
      <span className="text-base text-[#64748b]">{label}</span>
      <div className="flex min-w-0 items-center justify-end gap-2">
        <span
          className={`min-w-0 truncate text-right text-base font-bold ${mono ? "font-mono tracking-wide" : ""} ${highlight ? "text-xl text-[#dc2626]" : "text-[#0f172a]"}`}
        >
          {value}
        </span>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#64748b] hover:text-[#2563eb]"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-[#f7f9fc] px-4 py-3">
      <span className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        {label}
      </span>
      <span
        className={`mt-1 block min-w-0 break-words ${strong ? "text-lg font-black text-[#dc2626]" : "font-bold text-[#0f172a]"}`}
      >
        {value}
      </span>
    </div>
  )
}
