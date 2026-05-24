import { StaffShell } from "@/components/staff/StaffShell"
import { formatVND } from "@/lib/format"
import { getStaffHomeData } from "@/services/clinic.service"
import { AdminReportsClient } from "@/app/admin/reports/AdminReportsClient"

export default async function StaffReportsPage() {
  const { profile, appointments, services } = await getStaffHomeData()
  const completed = appointments.filter((appointment) => appointment.status === "COMPLETED")
  const depositRevenue = appointments.reduce(
    (sum, appointment) => sum + (appointment.payment?.amount ?? 0),
    0,
  )

  return (
    <StaffShell
      title="Báo cáo vận hành"
      description="Tạo báo cáo theo khoảng ngày và xem chi tiết ngay trong trang"
      profileName={profile.fullName}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-hairline-muted bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
              Lịch hẹn
            </div>
            <div className="mt-2 text-3xl font-bold text-ink">{appointments.length}</div>
          </div>
          <div className="rounded-3xl border border-hairline-muted bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
              Hoàn thành
            </div>
            <div className="mt-2 text-3xl font-bold text-[#16a34a]">{completed.length}</div>
          </div>
          <div className="rounded-3xl border border-hairline-muted bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
              Đã thu cọc
            </div>
            <div className="mt-2 text-2xl font-bold text-[#f59e0b]">
              {formatVND(depositRevenue)}
            </div>
          </div>
        </div>

        <AdminReportsClient appointments={appointments} services={services} />
      </div>
    </StaffShell>
  )
}
