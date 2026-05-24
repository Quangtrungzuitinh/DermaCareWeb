"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { ArrowLinkButton } from "@/components/shared/ArrowLinkButton"
import { Initials } from "@/components/shared/InitialsAvatar"
import {
  DASHBOARD_PREVIEW_ITEMS,
  DASHBOARD_WEEK_DAYS,
  DATE_STRIP_OFFSET_DAYS,
  ONE_DAY_MS,
} from "@/lib/constants"
import { getPatientName } from "@/lib/appointment-utils"
import { formatAppointmentDate, ymd } from "@/lib/format"
import type { UiAppointment } from "@/services/clinic.types"

const HIGHLIGHT = "#2563eb"

export function DoctorTodayAppointmentsPanel({
  selectedDate,
  onDateChange,
  appointments,
  onSelect,
}: {
  selectedDate: string
  onDateChange: (date: string) => void
  appointments: UiAppointment[]
  onSelect: (appointment: UiAppointment) => void
}) {
  const date = new Date(`${selectedDate}T00:00:00+07:00`)
  const isToday = selectedDate === ymd(new Date())
  return (
    <div className="min-h-[320px] rounded-3xl border border-hairline-muted bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-ink">
            {isToday ? "Lịch hẹn hôm nay" : `Lịch hẹn ${formatAppointmentDate(date, "dd/MM")}`}
          </h3>
          <p className="text-xs text-muted">{appointments.length} cuộc hẹn</p>
        </div>
        <ArrowLinkButton
          to="/doctor/appointments"
          search={{ tab: "calendar" }}
          label="Mở lịch hẹn"
          size="sm"
        />
      </div>
      <DateStrip selectedDate={selectedDate} onDateChange={onDateChange} />
      {appointments.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-surface-soft py-8 text-center text-sm text-muted">
          Không có lịch hẹn trong ngày này
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {appointments.slice(0, DASHBOARD_PREVIEW_ITEMS).map((appointment, index) => (
            <button
              key={appointment.id}
              type="button"
              onClick={() => onSelect(appointment)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(37,99,235,0.12)]"
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
                  {appointment.visitReason ?? appointment.notes ?? "Chưa ghi lý do khám"}
                </div>
              </div>
              {getClinicalState(appointment) === "draft" && (
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Draft
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DateStrip({
  selectedDate,
  onDateChange,
}: {
  selectedDate: string
  onDateChange: (date: string) => void
}) {
  const selected = new Date(`${selectedDate}T00:00:00+07:00`)
  const start = new Date(selected.getTime() - DATE_STRIP_OFFSET_DAYS * ONE_DAY_MS)
  const days = Array.from(
    { length: DASHBOARD_WEEK_DAYS },
    (_, index) => new Date(start.getTime() + index * ONE_DAY_MS),
  )
  const shift = (daysDelta: number) => {
    const next = new Date(selected.getTime() + daysDelta * ONE_DAY_MS)
    onDateChange(ymd(next))
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => shift(-1)}
        className="flex h-7 w-6 items-center justify-center text-muted transition hover:text-primary"
        aria-label="Trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex flex-1 items-start justify-between">
        {days.map((day) => {
          const key = ymd(day)
          const isSelected = key === selectedDate
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDateChange(key)}
              className="group/day flex flex-col items-center gap-0.5"
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                  isSelected
                    ? "text-white"
                    : "text-ink group-hover/day:bg-primary-light group-hover/day:text-primary"
                }`}
                style={isSelected ? { backgroundColor: HIGHLIGHT } : undefined}
              >
                {day.getDate()}
              </span>
              <span className="text-[9px] uppercase text-muted-soft">
                {formatAppointmentDate(day, "EEE").slice(0, 3)}
              </span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => shift(1)}
        className="flex h-7 w-6 items-center justify-center text-muted transition hover:text-primary"
        aria-label="Sau"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function getClinicalState(appointment: UiAppointment) {
  if (appointment.status === "COMPLETED") return "done"
  if (!appointment.medicalRecord || appointment.status !== "CONFIRMED") return "none"
  return new Date(appointment.appointmentDate).getTime() > Date.now() ? "draft" : "ready"
}
