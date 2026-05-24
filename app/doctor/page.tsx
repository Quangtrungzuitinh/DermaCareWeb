import { CheckCircle2, ClipboardList, Users } from "lucide-react"

import { DoctorShell } from "@/components/doctor/DoctorShell"
import { DashboardHeader } from "@/components/shared/DashboardHeader"
import { InsightCard } from "@/components/shared/InsightCard"
import { TOP_SERVICES_LIMIT } from "@/lib/constants"
import { buildDailyStats, buildDashboardWindow } from "@/lib/dashboard-stats"
import { getDoctorHomeData } from "@/services/clinic.service"
import { TreatmentValueCard } from "@/components/doctor/dashboard/TreatmentValueCard"
import { WeeklyAppointmentsCard } from "@/components/doctor/dashboard/WeeklyAppointmentsCard"
import { TopServicesChart } from "@/components/doctor/dashboard/TopServicesChart"
import { DoctorHomeTodayClient } from "./DoctorHomeTodayClient"

type DoctorHomeData = Awaited<ReturnType<typeof getDoctorHomeData>>
type DoctorAppointment = DoctorHomeData["appointments"][number]
type DoctorService = DoctorHomeData["services"][number]

export default async function DoctorHomePage() {
  const { profile, doctor, appointments, services, generatedAt } = await getDoctorHomeData()
  const now = new Date(generatedAt)
  const dashboard = buildDashboardWindow(appointments, now)

  const dailyStats = buildDailyStats(appointments, now, (day) =>
    day.reduce((sum, a) => sum + getTreatmentTotal(a), 0),
  )

  const treatmentTotal = dashboard.weekAppointments.reduce(
    (sum, appointment) => sum + getTreatmentTotal(appointment),
    0,
  )
  const activeServices = services.filter((service) => service.isActive).length
  const topServices = getTopTreatmentServices(appointments, services)

  return (
    <DoctorShell
      title="Tổng quan"
      description="Hoạt động khám bệnh của bạn"
      profileName={profile.fullName}
      profileEmail={profile.email ?? undefined}
    >
      <div className="space-y-6">
        <DashboardHeader
          eyebrow="Chào buổi sáng,"
          title={profile.fullName}
          subtitle={doctor?.specialty ?? "Bác sĩ da liễu"}
          from={dashboard.from}
          to={now}
          actionHref="/doctor/appointments?tab=list"
          actionLabel="Mở lịch hẹn"
        />

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <TreatmentValueCard
              total={treatmentTotal}
              updatedLabel={dashboard.updateLabel}
              bars={dailyStats.map((stat) => ({ date: stat.date, value: stat.value }))}
            />
            <WeeklyAppointmentsCard
              total={dashboard.weekAppointments.length}
              updatedLabel={dashboard.updateLabel}
              bars={dailyStats.map((stat) => ({ date: stat.date, value: stat.count }))}
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
            <InsightCard
              icon={ClipboardList}
              label="Dịch vụ đang active"
              value={String(activeServices)}
              updatedLabel="Danh mục"
              tone="slate"
            />
          </div>

          <div className="space-y-5 lg:col-span-8">
            <div className="grid gap-5 md:grid-cols-2">
              <TopServicesChart services={topServices} />
              <DoctorHomeTodayClient
                today={now.toISOString()}
                appointments={appointments}
                services={services.filter((service) => service.isActive)}
              />
            </div>
          </div>
        </section>
      </div>
    </DoctorShell>
  )
}

function getTopTreatmentServices(appointments: DoctorAppointment[], services: DoctorService[]) {
  const treatmentMap = new Map<string, Pick<DoctorService, "id" | "name"> & { count: number }>()

  for (const appointment of appointments) {
    for (const treatment of appointment.medicalRecord?.treatments ?? []) {
      const existing = treatmentMap.get(treatment.serviceId)
      treatmentMap.set(treatment.serviceId, {
        id: treatment.serviceId,
        name: treatment.serviceName,
        count: (existing?.count ?? 0) + treatment.quantity,
      })
    }
  }

  const treatmentServices = Array.from(treatmentMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_SERVICES_LIMIT)

  if (treatmentServices.length > 0) return treatmentServices

  return services
    .filter((service) => service.isActive)
    .slice(0, TOP_SERVICES_LIMIT)
    .map((service) => ({ id: service.id, name: service.name, count: service.bookingCount30d ?? 0 }))
}

function getTreatmentTotal(appointment: DoctorAppointment) {
  return (
    appointment.medicalRecord?.treatments.reduce(
      (sum, treatment) => sum + treatment.priceAtTime * treatment.quantity,
      0,
    ) ?? 0
  )
}
