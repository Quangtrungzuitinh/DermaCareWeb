import { StaffShell } from "@/components/staff/StaffShell"
import { StaffPaymentsClient } from "@/app/staff/payments/StaffPaymentsClient"
import { getStaffPayments } from "@/services/clinic.service"
import { formatVND } from "@/lib/format"

export default async function StaffPaymentsPage() {
  const rows = await getStaffPayments()

  const confirmed = rows.filter((r) => r.payment)
  const pending = rows.filter((r) => !r.payment)
  const totalConfirmed = confirmed.reduce((sum, r) => sum + (r.payment?.amount ?? r.baseFee), 0)

  return (
    <StaffShell title="Thanh toán cọc" description={`${rows.length} giao dịch cần xử lý`}>
      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-hairline-muted bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
            Tổng giao dịch
          </div>
          <div className="mt-2 text-3xl font-bold text-ink">{rows.length}</div>
        </div>
        <div className="rounded-3xl border border-hairline-muted bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
            Chờ xác nhận
          </div>
          <div className="mt-2 text-3xl font-bold text-[#f59e0b]">{pending.length}</div>
        </div>
        <div className="rounded-3xl border border-hairline-muted bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
            Đã thu
          </div>
          <div className="mt-2 text-2xl font-bold text-[#16a34a]">{formatVND(totalConfirmed)}</div>
        </div>
      </div>

      <StaffPaymentsClient rows={rows} />
    </StaffShell>
  )
}
