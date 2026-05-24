"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { Initials } from "@/components/shared/InitialsAvatar"
import { ArrowLinkButton } from "@/components/shared/ArrowLinkButton"
import { formatAppointmentDate, TZ } from "@/lib/format"
import type { PatientDashboardAppointment } from "@/services/patient.types"
import { SoftCard, DARK } from "./DashboardCards"

const HIGHLIGHT = "#2563eb"

export function UpcomingPanel({ appointments }: { appointments: PatientDashboardAppointment[] }) {
  const [today, setToday] = useState<Date>(new Date())
  useEffect(() => {
    setToday(new Date())
  }, [])

  const [selectedIdx, setSelectedIdx] = useState(3)
  const [weekOffset, setWeekOffset] = useState(0)

  const week = useMemo(() => {
    const base = new Date(today)
    base.setDate(base.getDate() + weekOffset * 7 - 3)
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      return d
    })
  }, [today, weekOffset])

  const selectedDate = week[selectedIdx] ?? week[0]

  const dayAppts = useMemo(() => {
    if (!selectedDate) return [] as PatientDashboardAppointment[]
    const key = formatInTimeZone(selectedDate, TZ, "yyyy-MM-dd")
    return appointments
      .filter((a) => formatInTimeZone(new Date(a.appointmentDate), TZ, "yyyy-MM-dd") === key)
      .sort((a, b) => +new Date(a.appointmentDate) - +new Date(b.appointmentDate))
  }, [appointments, selectedDate])

  const slots = useMemo(
    () => dayAppts.map((a) => ({ time: formatAppointmentDate(a.appointmentDate, "HH:mm"), a })),
    [dayAppts],
  )

  return (
    <SoftCard className="p-5 h-full flex flex-col">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold tracking-tight leading-tight" style={{ color: DARK }}>
          Lịch hẹn
          <br /> sắp tới
        </h3>
        <ArrowLinkButton to="/patient/appointments" label="Mở lịch hẹn" />
      </div>

      <div className="mt-4 flex items-center gap-1">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="h-7 w-5 inline-flex items-center justify-center text-muted-soft hover:text-ink"
          aria-label="Trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 grid grid-cols-6 gap-1">
          {week.map((d, i) => {
            const selected = i === selectedIdx
            return (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`flex flex-col items-center py-2 rounded-full transition ${
                  selected ? "text-white" : "text-[#475569] hover:bg-hairline-soft"
                }`}
                style={selected ? { backgroundColor: HIGHLIGHT } : undefined}
              >
                <span className="text-base font-bold leading-none">
                  {formatAppointmentDate(d, "d")}
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-wide opacity-80">
                  {formatAppointmentDate(d, "EEE")}
                </span>
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="h-7 w-5 inline-flex items-center justify-center text-muted-soft hover:text-ink"
          aria-label="Sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 space-y-3 flex-1">
        {dayAppts.length === 0 ? (
          <div className="rounded-2xl bg-surface-soft py-10 text-center text-sm text-muted">
            Bạn không có lịch hôm nay
          </div>
        ) : (
          slots.map((s, i) => (
            <div key={i} className="group/slot flex items-stretch gap-3">
              <div className="text-[11px] text-muted-soft font-medium w-12 pt-2 leading-tight text-right">
                {s.time}
                <div>{Number(s.time.split(":")[0]) < 12 ? "AM" : "PM"}</div>
              </div>
              <div
                className="flex-1 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 transition-all duration-200 group-hover/slot:-translate-y-0.5 group-hover/slot:shadow-[0_8px_20px_rgba(37,99,235,0.12)]"
                style={{
                  backgroundColor:
                    s.a.status === "CONFIRMED"
                      ? "#bfdbfe"
                      : s.a.status === "PENDING_PAYMENT"
                        ? "#fef3c7"
                        : "#e0e7ff",
                }}
              >
                <Initials name={s.a.doctor.fullName} size={32} />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: DARK }}>
                    {s.a.doctor.fullName}
                  </div>
                  <div className="text-[11px]" style={{ color: DARK, opacity: 0.7 }}>
                    {formatAppointmentDate(s.a.appointmentDate, "HH:mm")}
                    {s.a.durationMin ? ` · ${s.a.durationMin} phút` : ""}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </SoftCard>
  )
}
