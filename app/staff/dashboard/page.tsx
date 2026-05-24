import { CalendarCheck2, CheckCircle2, Users, Wallet } from "lucide-react"

import { InsightCard } from "@/components/shared/InsightCard"
import { DashboardHeader } from "@/components/shared/DashboardHeader"
import { StaffShell } from "@/components/staff/StaffShell"
import { DashboardBarCard } from "@/components/admin/dashboard/DashboardBarCard"
import { TopServicesChart } from "@/components/admin/dashboard/TopServicesChart"
import { TodayAppointmentsPanel } from "@/components/admin/dashboard/TodayAppointmentsPanel"
import { StaffTodayTable } from "@/components/staff/dashboard/StaffTodayTable"
import { formatVND } from "@/lib/format"
import { TOP_SERVICES_LIMIT } from "@/lib/constants"
import { buildDailyStats, buildDashboardWindow } from "@/lib/dashboard-stats"
import { getStaffHomeData } from "@/services/clinic.service"

const DARK = "#0f2a3f"

export default async function StaffDashboardPage() {
  const { profile, appointments, services, generatedAt } = await getStaffHomeData()
  const now = new Date(generatedAt)
  const dashboard = buildDashboardWindow(appointments, now)

  const dailyStats = buildDailyStats(appointments, now, (day) =>
    day
      .filter((a) => a.status === "COMPLETED")
      .reduce((sum, a) => sum + (a.payment?.amount ?? a.baseFee), 0),
  )

  const topServices = services
    .filter((s) => s.isActive)
    .map((s) => ({ ...s, count: s.bookingCount30d ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_SERVICES_LIMIT)

  return (
    <StaffShell
      title="Bảng điều hành"
      description="Tổng quan vận hành phòng khám trong tuần"
      profileName={profile.fullName}
      profileEmail={profile.email ?? undefined}
    >
      <div className="space-y-6">
        <DashboardHeader
          eyebrow={`Hi ${profile.fullName},`}
          title="Chào buổi sáng!"
          from={dashboard.from}
          to={now}
          actionHref="/staff/appointments?tab=list"
          actionLabel="Đặt lịch"
        />

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <DashboardBarCard
              icon={Wallet}
              label="Tổng doanh thu (7 ngày)"
              value={formatVND(dashboard.weekRevenue)}
              updatedLabel={dashboard.updateLabel}
              bars={dailyStats.map((s) => ({ date: s.date, value: s.value }))}
              barColor={DARK}
              barOpacityEmpty={0.25}
            />
            <DashboardBarCard
              icon={CalendarCheck2}
              label="Tổng lịch hẹn trong tuần"
              value={String(dashboard.weekAppointments.length)}
              updatedLabel={dashboard.updateLabel}
              bars={dailyStats.map((s) => ({ date: s.date, value: s.count }))}
              barColor="#bfdbfe"
              barOpacityEmpty={0.4}
            />
            <InsightCard
              icon={Users}
              label="Bệnh nhân tuần này"
              value={String(dashboard.uniquePatients)}
              updatedLabel={dashboard.updateLabel}
            />
            <InsightCard
              icon={CheckCircle2}
              label="Lịch đã hoàn thành"
              value={String(dashboard.completedCount)}
              updatedLabel="7 ngày"
              tone="green"
            />
          </div>

          <div className="space-y-5 lg:col-span-8">
            <div className="grid gap-5 md:grid-cols-2">
              <TopServicesChart
                services={topServices}
                linkTo="/staff/appointments"
                linkLabel="Xem chi tiết dịch vụ"
                subtitle="Số lượt sử dụng gần đây"
              />
              <TodayAppointmentsPanel
                today={now}
                todayAppointments={dashboard.todayAppointments}
                appointmentsHref="/staff/appointments"
              />
            </div>
            <StaffTodayTable appointments={dashboard.todayAppointments} />
          </div>
        </section>
      </div>
    </StaffShell>
  )
}
