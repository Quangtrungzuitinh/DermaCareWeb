"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowUpRight,
  CalendarClock,
  CalendarCheck2,
  CalendarDays,
  Sparkles,
  Stethoscope,
} from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { PatientShell } from "@/components/patient/PatientShell"
import { ArrowLinkButton } from "@/components/shared/ArrowLinkButton"
import { formatAppointmentDate, TZ } from "@/lib/format"
import type { PatientDashboardData } from "@/services/patient.types"
import {
  SoftCard,
  StatHead,
  StatRow,
  ACCENT,
  ACCENT_FG,
  DARK,
} from "@/components/patient/dashboard/DashboardCards"
import { UpcomingPanel } from "@/components/patient/dashboard/UpcomingPanel"
import { HistorySection } from "@/components/patient/dashboard/HistoryTable"

const HIGHLIGHT = "#2563eb"
const SOFT_HIGHLIGHT = "#bfdbfe"

export function PatientDashboardClient({ data }: { data: PatientDashboardData }) {
  const {
    profile,
    stats,
    monthlyCounts,
    upcomingAppointments,
    historyRows,
    healthTip,
    generatedAt,
  } = data

  const upcoming = upcomingAppointments
  const completed = historyRows.filter((a) => a.status === "COMPLETED")
  const cancelled = historyRows.filter((a) => a.status === "CANCELLED" || a.status === "NO_SHOW")

  const [greet, setGreet] = useState("Chào buổi sáng!")
  const [nowLabel, setNowLabel] = useState<string>(
    formatAppointmentDate(generatedAt, "EEE, dd MMM yyyy · HH:mm"),
  )
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const h = d.getHours()
      setGreet(h < 12 ? "Chào buổi sáng!" : h < 18 ? "Chào buổi chiều!" : "Chào buổi tối!")
      setNowLabel(formatInTimeZone(d, TZ, "EEE, dd MMM yyyy · HH:mm"))
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <PatientShell title="Tổng quan" profile={profile}>
      <div className="space-y-6">
        <section className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-muted">Hi {profile.fullName.split(" ").slice(-1)[0]},</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-1 text-[#0f2a3f]">
              {greet}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-2.5 bg-white rounded-full pl-1.5 pr-4 py-1.5 border border-hairline-muted"
              style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
            >
              <span
                className="h-8 w-8 rounded-full inline-flex items-center justify-center"
                style={{ backgroundColor: ACCENT, color: ACCENT_FG }}
              >
                <CalendarDays className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium" style={{ color: DARK }}>
                {nowLabel}
              </span>
            </div>
            <Link
              href="/patient/booking/select"
              className="inline-flex items-center gap-1.5 rounded-full px-5 h-10 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: HIGHLIGHT }}
            >
              Đặt lịch
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            <SoftCard className="p-5">
              <StatHead
                icon={CalendarDays}
                label="Tổng lịch hẹn"
                value={String(stats.totalAppointments)}
                pill={`Cập nhật ${formatAppointmentDate(generatedAt, "dd/MM/yyyy")}`}
              />
              <div className="mt-4 flex items-end justify-between gap-1.5 h-[88px]">
                {monthlyCounts.map((m, i) => {
                  const max = Math.max(...monthlyCounts.map((x) => x.count), 1)
                  const h = 14 + (m.count / max) * 70
                  return (
                    <div
                      key={i}
                      className="flex-1 origin-bottom rounded-full transition-transform duration-200 hover:scale-y-105"
                      style={{
                        height: h,
                        backgroundColor: m.isCurrent ? HIGHLIGHT : DARK,
                        opacity: m.count === 0 ? 0.25 : 1,
                      }}
                      title={`${m.label}: ${m.count}`}
                    />
                  )
                })}
              </div>
            </SoftCard>

            <SoftCard className="px-5 py-4">
              <StatRow
                icon={CalendarClock}
                label="Sắp tới"
                value={String(stats.upcomingAppointments)}
                pill="Đã xác nhận"
              />
            </SoftCard>
            <SoftCard className="px-5 py-4">
              <StatRow
                icon={CalendarCheck2}
                label="Đã hoàn thành"
                value={String(stats.completedAppointments)}
                pill="Tổng cộng"
              />
            </SoftCard>
            <SoftCard className="px-5 py-4">
              <StatRow
                icon={Stethoscope}
                label="Bác sĩ thường gặp"
                value={
                  stats.frequentlyVisitedDoctor
                    ? stats.frequentlyVisitedDoctor.name.replace(/^BS\.\s*/, "")
                    : "—"
                }
                pill={
                  stats.frequentlyVisitedDoctor
                    ? `${stats.frequentlyVisitedDoctor.count} lượt`
                    : "—"
                }
                small
              />
            </SoftCard>

            <div
              className="rounded-3xl p-5 text-white relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(37,99,235,0.18)]"
              style={{
                background:
                  "radial-gradient(120% 80% at 100% 0%, #3b82f6 0%, transparent 55%), linear-gradient(135deg, #0f2a3f 0%, #1e3a8a 100%)",
                minHeight: 180,
              }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] font-medium">
                <Sparkles className="h-3 w-3" /> {healthTip.label}
              </span>
              <h4 className="mt-6 text-lg font-semibold leading-snug">{healthTip.title}</h4>
              <div
                className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full"
                style={{ background: "rgba(59,130,246,0.45)", filter: "blur(18px)" }}
              />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <SoftCard className="p-5 flex flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight" style={{ color: DARK }}>
                      Thống kê lịch hẹn
                    </h3>
                    <p className="text-xs text-muted mt-0.5">6 tháng gần đây</p>
                  </div>
                  <ArrowLinkButton
                    to="/patient/appointments"
                    search={{ tab: "list" }}
                    label="Xem danh sách lịch hẹn"
                  />
                </div>
                <div className="mt-4 relative flex-1 min-h-[200px] flex items-end justify-between gap-2 pl-8">
                  <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] text-muted-soft">
                    {[6, 4, 2, 0].map((v) => (
                      <span key={v}>{v}</span>
                    ))}
                  </div>
                  <div
                    className="absolute left-8 right-0 border-t border-dashed border-hairline"
                    style={{ top: 28 }}
                  />
                  {monthlyCounts.map((m, i) => {
                    const max = Math.max(...monthlyCounts.map((x) => x.count), 6)
                    const h = (m.count / max) * 150
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 relative">
                        {m.isCurrent && (
                          <span
                            className="absolute -top-6 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-sm whitespace-nowrap"
                            style={{ backgroundColor: HIGHLIGHT }}
                          >
                            {m.count} hẹn
                          </span>
                        )}
                        <div
                          className="w-full origin-bottom rounded-full transition-transform duration-200 hover:scale-y-105"
                          style={{
                            height: Math.max(h, 14),
                            backgroundColor: m.isCurrent ? HIGHLIGHT : SOFT_HIGHLIGHT,
                            maxWidth: 38,
                          }}
                        />
                        <span
                          className={`text-[11px] ${m.isCurrent ? "font-semibold" : "text-muted"}`}
                          style={m.isCurrent ? { color: DARK } : undefined}
                        >
                          {m.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </SoftCard>

              <UpcomingPanel appointments={upcomingAppointments} />
            </div>

            <HistorySection
              historyRows={historyRows}
              upcoming={upcoming}
              completed={completed}
              cancelled={cancelled}
            />
          </div>
        </section>
      </div>
    </PatientShell>
  )
}
