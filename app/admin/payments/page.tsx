import { AdminShell } from "@/components/admin/AdminShell"
import { InsightCard } from "@/components/shared/InsightCard"
import { requireRole } from "@/lib/auth/require-role"
import { getStaffPayments } from "@/services/clinic.service"
import { formatVND } from "@/lib/format"
import { CreditCard, DollarSign, Clock } from "lucide-react"
import { AdminPaymentsClient } from "./AdminPaymentsClient"

export default async function AdminPaymentsPage() {
  const { profile } = await requireRole(["ADMIN"])
  const rows = await getStaffPayments()

  const confirmed = rows.filter((r) => r.payment)
  const pending = rows.filter((r) => !r.payment)
  const totalConfirmed = confirmed.reduce((sum, r) => sum + (r.payment?.amount ?? r.baseFee), 0)

  return (
    <AdminShell
      title="Thanh toán cọc"
      description={`${rows.length} giao dịch cần theo dõi`}
      profileName={profile.fullName}
    >
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InsightCard
            icon={CreditCard}
            label="Tổng giao dịch"
            value={String(rows.length)}
            tone="blue"
          />
          <InsightCard
            icon={Clock}
            label="Chờ xác nhận"
            value={String(pending.length)}
            tone="amber"
          />
          <InsightCard
            icon={DollarSign}
            label="Đã thu"
            value={formatVND(totalConfirmed)}
            tone="green"
          />
        </div>

        <AdminPaymentsClient rows={rows} />
      </div>
    </AdminShell>
  )
}
