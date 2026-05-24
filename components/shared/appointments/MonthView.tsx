"use client"

import { useState, useMemo } from "react"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { Initials } from "@/components/shared/InitialsAvatar"
import { formatAppointmentDate } from "@/lib/format"
import type { UiAppointment } from "@/services/clinic.types"
import { pal, sameDate } from "./calendar-utils"

export function MonthView({
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
  const [dayDetail, setDayDetail] = useState<Date | null>(null)

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const start = new Date(first)
    start.setDate(first.getDate() - offset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  const today = new Date()
  const apptsByDay = (d: Date) =>
    appointments.filter((a) => sameDate(new Date(a.appointmentDate), d))
  const dayAppts = dayDetail ? apptsByDay(dayDetail) : []

  return (
    <div className="px-5 md:px-7 pb-6">
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
          <div
            key={d}
            className="text-center text-[11px] text-[#94a3b8] font-semibold uppercase tracking-wider py-2"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          const isToday = sameDate(d, today)
          const otherMonth = d.getMonth() !== cursor.getMonth()
          const items = apptsByDay(d).filter((a) => !["CANCELLED", "NO_SHOW"].includes(a.status))
          const dots = items.slice(0, 3)
          const more = items.length - dots.length
          const isSelected = dayDetail ? sameDate(d, dayDetail) : false
          return (
            <button
              key={i}
              type="button"
              onClick={() =>
                setDayDetail(apptsByDay(d).length > 0 ? (isSelected ? null : d) : null)
              }
              className={`min-h-[76px] p-2.5 text-left rounded-2xl transition ${
                otherMonth ? "text-[#cbd5e1]" : "hover:bg-[#eef2f7]"
              } ${isSelected ? "ring-2 ring-[#2563eb]" : ""}`}
              style={
                isToday
                  ? { boxShadow: "inset 0 0 0 2px #2563eb", background: "white" }
                  : otherMonth
                    ? { background: "transparent" }
                    : { background: "#f7f9fc" }
              }
            >
              <div className={`text-sm font-semibold ${isToday ? "text-[#2563eb]" : ""}`}>
                {d.getDate()}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {dots.map((a, j) => (
                  <span
                    key={j}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: pal(a.status).border }}
                  />
                ))}
                {more > 0 && <span className="text-[10px] text-[#64748b]">+{more}</span>}
              </div>
            </button>
          )
        })}
      </div>

      {dayDetail && dayAppts.length > 0 && (
        <div className="mt-4 space-y-2 rounded-2xl border border-[#eef2f7] bg-[#f7f9fc] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
            {formatAppointmentDate(dayDetail, "EEEE, dd/MM/yyyy")}
          </p>
          {dayAppts
            .sort((a, b) => +new Date(a.appointmentDate) - +new Date(b.appointmentDate))
            .map((a) => {
              const p = pal(a.status)
              const name = a.patient?.fullName ?? a.guestName ?? "Khách vãng lai"
              const sub = showDoctor ? a.doctor.fullName : (a.visitReason ?? a.notes ?? "Lịch khám")
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectAppointment(a)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition hover:shadow-sm"
                  style={{ background: p.bg, borderLeft: `4px solid ${p.border}` }}
                >
                  <div className="text-sm font-bold flex-shrink-0" style={{ color: p.text }}>
                    {formatAppointmentDate(a.appointmentDate, "HH:mm")}
                  </div>
                  <Initials name={name} size={28} bg={p.bg} fg={p.text} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#0f172a] truncate">{name}</div>
                    <div className="text-xs text-[#64748b] truncate">{sub}</div>
                  </div>
                  <AppointmentStatusBadge status={a.status} />
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
