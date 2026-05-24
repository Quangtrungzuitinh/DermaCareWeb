import { CalendarCheck2, CheckCircle2, Stethoscope, Users, Wallet } from "lucide-react"

import { AdminShell } from "@/components/admin/AdminShell"
import { DashboardBarCard, DARK } from "@/components/admin/dashboard/DashboardBarCard"
import { StatusOverview } from "@/components/admin/dashboard/StatusOverview"
import { TodayAppointmentsPanel } from "@/components/admin/dashboard/TodayAppointmentsPanel"
import { TodayAppointmentsTable } from "@/components/admin/dashboard/TodayAppointmentsTable"
import { TopServicesChart } from "@/components/admin/dashboard/TopServicesChart"
import { DashboardHeader } from "@/components/shared/DashboardHeader"
import { InsightCard } from "@/components/shared/InsightCard"
import { TOP_SERVICES_LIMIT } from "@/lib/constants"
import { buildDailyStats, buildDashboardWindow, buildStatusStats } from "@/lib/dashboard-stats"
import { formatVND } from "@/lib/format"
import { getAdminHomeData } from "@/services/clinic.service"

type AdminHomeData = Awaited<ReturnType<typeof getAdminHomeData>>
type AdminAppointment = AdminHomeData["appointments"][number]

export default async function AdminDashboardPage() {
  const { profile, appointments, doctors, services, users, generatedAt } = await getAdminHomeData()
  const now = new Date(generatedAt)
  const dashboard = buildDashboardWindow(appointments, now)

  const dailyStats = buildDailyStats(appointments, now, (day) =>
    day
      .filter((appointment) => appointment.status === "COMPLETED")
      .reduce((sum, appointment) => sum + getAppointmentRevenue(appointment), 0),
  )

  const topServices = services
    .filter((service) => service.isActive)
    .map((service) => ({ ...service, count: service.bookingCount30d ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_SERVICES_LIMIT)

  const activeDoctors = doctors.filter((doctor) => doctor.isActive).length
  const patientCount = users.filter((user) => user.role === "PATIENT").length
  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  )
  const totalRevenue = completedAppointments.reduce(
    (sum, appointment) => sum + getAppointmentRevenue(appointment),
    0,
  )
  const statusStats = buildStatusStats(appointments)

  return (
    <AdminShell
      title="Bảng điều hành"
      description="Tổng quan vận hành phòng khám"
      profileName={profile.fullName}
      profileEmail={profile.email ?? undefined}
    >
      <div className="space-y-6">
        <DashboardHeader
          eyebrow={`Hi ${profile.fullName},`}
          title="Tổng quan quản trị"
          subtitle="Theo dõi lịch hẹn, doanh thu, bác sĩ và dịch vụ"
          from={dashboard.from}
          to={now}
          actionHref="/admin/appointments?tab=list"
          actionLabel="Mở lịch hẹn"
        />

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <DashboardBarCard
              icon={Wallet}
              label="Doanh thu 7 ngày"
              value={formatVND(dashboard.weekRevenue)}
              updatedLabel={dashboard.updateLabel}
              bars={dailyStats.map((stat) => ({ date: stat.date, value: stat.value }))}
              barColor={DARK}
              barOpacityEmpty={0.25}
            />
            <DashboardBarCard
              icon={CalendarCheck2}
              label="Lịch hẹn 7 ngày"
              value={String(dashboard.weekAppointments.length)}
              updatedLabel={dashboard.updateLabel}
              bars={dailyStats.map((stat) => ({ date: stat.date, value: stat.count }))}
              barColor="#bfdbfe"
              barOpacityEmpty={0.4}
            />
            <InsightCard
              icon={Wallet}
              label="Tổng doanh thu"
              value={formatVND(totalRevenue)}
              updatedLabel="Đã hoàn thành"
            />
            <InsightCard
              icon={Users}
              label="Bệnh nhân"
              value={String(patientCount)}
              updatedLabel="Hệ thống"
              tone="slate"
            />
            <InsightCard
              icon={Stethoscope}
              label="Bác sĩ đang hoạt động"
              value={String(activeDoctors)}
              updatedLabel={`${doctors.length} hồ sơ`}
              tone="blue"
            />
            <InsightCard
              icon={CheckCircle2}
              label="Lịch đã hoàn thành"
              value={String(completedAppointments.length)}
              updatedLabel="Hệ thống"
              tone="green"
            />
          </div>

          <div className="space-y-5 lg:col-span-8">
            <div className="grid gap-5 md:grid-cols-2">
              <TopServicesChart services={topServices} />
              <TodayAppointmentsPanel
                today={now}
                todayAppointments={dashboard.todayAppointments}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <StatusOverview stats={statusStats} total={appointments.length} />
              <TodayAppointmentsTable appointments={dashboard.todayAppointments} />
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  )
}

function getAppointmentRevenue(appointment: AdminAppointment) {
  const treatmentTotal =
    appointment.medicalRecord?.treatments.reduce(
      (sum, treatment) => sum + treatment.priceAtTime * treatment.quantity,
      0,
    ) ?? 0

  return treatmentTotal || appointment.payment?.amount || appointment.baseFee
}
