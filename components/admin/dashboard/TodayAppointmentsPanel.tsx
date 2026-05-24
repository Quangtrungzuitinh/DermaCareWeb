import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { Initials } from "@/components/shared/InitialsAvatar"
import { ArrowLinkButton } from "@/components/shared/ArrowLinkButton"
import { formatAppointmentDate, TZ } from "@/lib/format"
import {
  ONE_DAY_MS,
  DASHBOARD_WEEK_DAYS,
  DASHBOARD_PREVIEW_ITEMS,
  DATE_STRIP_OFFSET_DAYS,
} from "@/lib/constants"
import { getPatientName } from "@/lib/appointment-utils"
import type { UiAppointment } from "@/services/clinic.types"

const HIGHLIGHT = "#2563eb"

export function TodayAppointmentsPanel({
  today,
  todayAppointments,
  appointmentsHref = "/admin/appointments",
}: {
  today: Date
  todayAppointments: UiAppointment[]
  appointmentsHref?: string
}) {
  return (
    <div className="min-h-[320px] rounded-3xl border border-hairline-muted bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Lịch hẹn hôm nay</h3>
        <ArrowLinkButton to={appointmentsHref} label="Mở lịch hẹn" size="sm" />
      </div>
      <DateStrip today={today} />
      {todayAppointments.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-surface-soft py-8 text-center text-sm text-muted">
          Không có lịch hẹn hôm nay
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {todayAppointments.slice(0, DASHBOARD_PREVIEW_ITEMS).map((appointment, index) => (
            <div
              key={appointment.id}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(37,99,235,0.12)]"
              style={{ backgroundColor: index % 2 === 0 ? "#dbeafe" : "#eff6ff" }}
            >
              <div className="w-12 shrink-0 text-xs font-semibold text-[#0f2a3f]">
                {formatAppointmentDate(appointment.appointmentDate, "HH:mm")}
              </div>
              <Initials name={getPatientName(appointment)} size={28} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-[#0f2a3f]">
                  {getPatientName(appointment)}
                </div>
                <div className="truncate text-[10px] text-[#475569]">
                  {appointment.doctor.fullName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DateStrip({ today }: { today: Date }) {
  const start = new Date(today.getTime() - DATE_STRIP_OFFSET_DAYS * ONE_DAY_MS)
  const days = Array.from(
    { length: DASHBOARD_WEEK_DAYS },
    (_, index) => new Date(start.getTime() + index * ONE_DAY_MS),
  )
  const todayKey = formatInTimeZone(today, TZ, "yyyy-MM-dd")

  return (
    <div className="flex items-center gap-1">
      <button className="flex h-7 w-6 items-center justify-center text-muted" aria-label="Trước">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex flex-1 items-start justify-between">
        {days.map((day) => {
          const isToday = formatInTimeZone(day, TZ, "yyyy-MM-dd") === todayKey
          return (
            <div key={day.toISOString()} className="group/day flex flex-col items-center gap-0.5">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                  isToday
                    ? "text-white"
                    : "text-ink group-hover/day:bg-primary-light group-hover/day:text-primary"
                }`}
                style={isToday ? { backgroundColor: HIGHLIGHT } : undefined}
              >
                {day.getDate()}
              </span>
              <span className="text-[9px] uppercase text-muted-soft">
                {formatAppointmentDate(day, "EEE").slice(0, 3)}
              </span>
            </div>
          )
        })}
      </div>
      <button className="flex h-7 w-6 items-center justify-center text-muted" aria-label="Sau">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
