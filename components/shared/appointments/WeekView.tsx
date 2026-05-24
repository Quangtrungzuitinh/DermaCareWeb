"use client"

import { formatAppointmentDate } from "@/lib/format"
import type { UiAppointment } from "@/services/clinic.types"
import { pal, sameDate } from "./calendar-utils"

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i) // 8–18
const ROW_H = 80

export function WeekView({
  appointments,
  cursor,
  onSelectAppointment,
  showDoctor,
}: {
  appointments: UiAppointment[]
  cursor: Date
  onSelectAppointment: (appointment: UiAppointment) => void
  showDoctor: boolean
}) {
  const today = new Date()
  const start = new Date(cursor)
  const offset = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - offset)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
  const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px] px-5 md:px-7 pb-6">
        <div
          className="grid border-b border-[#eef2f7]"
          style={{ gridTemplateColumns: "60px repeat(7,1fr)" }}
        >
          <div className="text-[10px] text-[#94a3b8] font-medium pt-3 pb-3">GMT+7</div>
          {days.map((d, i) => {
            const isToday = sameDate(d, today)
            return (
              <div key={i} className="text-center py-3">
                <div
                  className="mx-auto inline-flex items-center justify-center rounded-full text-sm font-bold transition"
                  style={{
                    width: 32,
                    height: 32,
                    background: isToday ? "#2563eb" : "transparent",
                    color: isToday ? "#ffffff" : "#0f172a",
                  }}
                >
                  {d.getDate()}
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5 font-medium">{DAY_LABELS[i]}</div>
              </div>
            )
          })}
        </div>

        <div className="grid relative" style={{ gridTemplateColumns: "60px repeat(7,1fr)" }}>
          {HOURS.map((h) => (
            <div key={`h-${h}`} className="contents">
              <div
                className="text-[10px] text-[#94a3b8] pr-2 pt-2 border-t border-[#f1f5f9] select-none"
                style={{ height: ROW_H }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
              {days.map((_, di) => (
                <div
                  key={`${h}-${di}`}
                  className="border-t border-l border-[#f1f5f9]"
                  style={{ height: ROW_H }}
                />
              ))}
            </div>
          ))}

          {days.flatMap((d, di) => {
            const dayAppts = appointments.filter((a) => {
              const ad = new Date(a.appointmentDate)
              return (
                sameDate(ad, d) &&
                !["CANCELLED", "NO_SHOW"].includes(a.status) &&
                ad.getHours() >= (HOURS[0] ?? 8) &&
                ad.getHours() <= (HOURS[HOURS.length - 1] ?? 18)
              )
            })
            return dayAppts.map((a) => {
              const ad = new Date(a.appointmentDate)
              const startMin = (ad.getHours() - (HOURS[0] ?? 8)) * 60 + ad.getMinutes()
              const top = (startMin / 60) * ROW_H + 2
              const height = Math.max(((a.durationMin ?? 30) / 60) * ROW_H - 4, 52)
              const compact = height < 72
              const p = pal(a.status)
              const name = a.patient?.fullName ?? a.guestName ?? "Khách"
              const primary = showDoctor ? a.doctor.fullName : name
              const secondary = showDoctor ? name : (a.visitReason ?? a.notes ?? "Lịch khám")
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectAppointment(a)}
                  title={`${formatAppointmentDate(ad, "dd/MM/yyyy HH:mm")} - ${a.doctor.fullName} - ${name}`}
                  className={`absolute overflow-hidden rounded-2xl text-left shadow-sm transition hover:shadow-md ${
                    compact ? "px-2 py-1.5" : "p-2.5"
                  }`}
                  style={{
                    top,
                    left: `calc(60px + ${di} * ((100% - 60px) / 7) + 3px)`,
                    width: `calc((100% - 60px) / 7 - 6px)`,
                    height,
                    background: p.bg,
                    borderLeft: `3px solid ${p.border}`,
                  }}
                >
                  <div className="text-[11px] font-bold truncate" style={{ color: p.text }}>
                    {formatAppointmentDate(ad, "HH:mm")}
                  </div>
                  <div
                    className={`${compact ? "text-[10px]" : "text-[11px]"} font-semibold truncate mt-0.5`}
                    style={{ color: p.text, opacity: 0.9 }}
                  >
                    {primary}
                  </div>
                  {!compact && (
                    <div className="text-[10px] truncate" style={{ color: p.text, opacity: 0.65 }}>
                      {secondary}
                    </div>
                  )}
                </button>
              )
            })
          })}
        </div>
      </div>
    </div>
  )
}
