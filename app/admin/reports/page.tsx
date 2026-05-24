import { AdminShell } from "@/components/admin/AdminShell"
import { InsightCard } from "@/components/shared/InsightCard"
import { requireRole } from "@/lib/auth/require-role"
import { formatVND } from "@/lib/format"
import { getAdminHomeData } from "@/services/clinic.service"
import { BarChart3, CalendarDays, DollarSign } from "lucide-react"
import { AdminReportsClient } from "./AdminReportsClient"

export default async function AdminReportsPage() {
  const { profile } = await requireRole(["ADMIN"])
  const { appointments, services } = await getAdminHomeData()

  const completed = appointments.filter((appointment) => appointment.status === "COMPLETED")
  const depositRevenue = appointments.reduce(
    (sum, appointment) => sum + (appointment.payment?.amount ?? 0),
    0,
  )

  return (
    <AdminShell
      title="Báo cáo vận hành"
      description="Tạo báo cáo theo khoảng ngày và xem chi tiết ngay trong trang"
      profileName={profile.fullName}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InsightCard
            icon={CalendarDays}
            label="Lịch hẹn"
            value={String(appointments.length)}
            tone="blue"
          />
          <InsightCard
            icon={BarChart3}
            label="Hoàn thành"
            value={String(completed.length)}
            tone="green"
          />
          <InsightCard
            icon={DollarSign}
            label="Đã thu cọc"
            value={formatVND(depositRevenue)}
            tone="amber"
          />
        </div>

        <AdminReportsClient appointments={appointments} services={services} />
      </div>
    </AdminShell>
  )
}
