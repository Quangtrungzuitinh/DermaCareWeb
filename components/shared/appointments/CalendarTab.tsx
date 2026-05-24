"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AppointmentDetailDialog } from "@/components/shared/AppointmentDetailDialog"
import { APPOINTMENT_STATUS_LEGEND } from "@/lib/appointment-status"
import { formatAppointmentDate } from "@/lib/format"
import type { UiAppointment, UiService } from "@/services/clinic.types"
import { getInitialCalendarDate, pal } from "./calendar-utils"
import { MonthView } from "./MonthView"
import { WeekView } from "./WeekView"

export function CalendarTab({
  appointments,
  allowDetailActions,
  allowClinicalActions,
  allowPresenceConfirmation,
  clinicalServices,
  showDoctor,
}: {
  appointments: UiAppointment[]
  allowDetailActions: boolean
  allowClinicalActions: boolean
  allowPresenceConfirmation: boolean
  clinicalServices: UiService[]
  showDoctor: boolean
}) {
  const [mode, setMode] = useState<"month" | "week">("week")
  const [cursor, setCursor] = useState(() => getInitialCalendarDate(appointments))
  const [selectedAppointment, setSelectedAppointment] = useState<UiAppointment | null>(null)

  const label = formatAppointmentDate(cursor, "MMMM yyyy")

  const shift = (dir: 1 | -1) => {
    const d = new Date(cursor)
    if (mode === "month") d.setMonth(d.getMonth() + dir)
    else d.setDate(d.getDate() + dir * 7)
    setCursor(d)
  }

  return (
    <div className="bg-white rounded-3xl border border-[#eef2f7] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 md:px-7 pt-6 pb-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold capitalize text-[#0f172a]">{label}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {APPOINTMENT_STATUS_LEGEND.map(({ status, label: legendLabel }) => {
              const p = pal(status)
              return (
                <span
                  key={status}
                  className="inline-flex items-center gap-1.5 text-xs text-[#475569]"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: p.bg, boxShadow: `inset 0 0 0 2px ${p.ring}` }}
                  />
                  {legendLabel}
                </span>
              )
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full bg-[#f0f4f8] p-1">
            {(["month", "week"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`h-8 rounded-full px-4 text-xs font-semibold transition ${
                  mode === m ? "bg-white shadow-sm text-[#0f172a]" : "text-[#64748b]"
                }`}
              >
                {m === "month" ? "Tháng" : "Tuần"}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-[#f0f4f8] p-1">
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label="Previous"
              className="h-8 w-8 rounded-full hover:bg-white inline-flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4 text-[#0f172a]" />
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date())}
              className="px-3 h-8 rounded-full bg-white shadow-sm text-xs font-semibold text-[#0f172a]"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Next"
              className="h-8 w-8 rounded-full hover:bg-white inline-flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4 text-[#0f172a]" />
            </button>
          </div>
        </div>
      </div>

      {mode === "month" ? (
        <MonthView
          appointments={appointments}
          cursor={cursor}
          onSelectAppointment={setSelectedAppointment}
          showDoctor={showDoctor}
        />
      ) : (
        <WeekView
          appointments={appointments}
          cursor={cursor}
          onSelectAppointment={setSelectedAppointment}
          showDoctor={showDoctor}
        />
      )}

      <AppointmentDetailDialog
        appointment={selectedAppointment}
        allowActions={allowDetailActions}
        allowClinicalActions={allowClinicalActions}
        allowPresenceConfirmation={allowPresenceConfirmation}
        clinicalServices={clinicalServices}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null)
        }}
      />
    </div>
  )
}
