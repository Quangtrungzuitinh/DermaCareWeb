"use client"

import type { ReactNode } from "react"
import type { DayOfWeek } from "@/lib/generated/prisma"
import type { DayDraft } from "@/components/admin/doctors/ScheduleDialog"

export function ScheduleDayCard({
  day,
  item,
  onUpdate,
}: {
  day: { value: DayOfWeek; label: string }
  item: DayDraft
  onUpdate: (day: DayOfWeek, patch: Partial<DayDraft>) => void
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        item.enabled ? "border-[#bfdbfe] bg-[#eff6ff]" : "border-hairline-muted bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(event) => onUpdate(day.value, { enabled: event.target.checked })}
            className="rounded accent-[#2563eb]"
          />
          {day.label}
        </label>
        <span className="text-xs text-muted">
          {item.enabled ? `${item.start} - ${item.end}` : "Nghỉ"}
        </span>
      </div>

      {item.enabled && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Bắt đầu">
            <input
              type="time"
              value={item.start}
              onChange={(event) => onUpdate(day.value, { start: event.target.value })}
              className="h-10 w-full rounded-xl border border-hairline bg-white px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Kết thúc">
            <input
              type="time"
              value={item.end}
              onChange={(event) => onUpdate(day.value, { end: event.target.value })}
              className="h-10 w-full rounded-xl border border-hairline bg-white px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Thời lượng slot">
            <select
              value={item.slotDuration}
              onChange={(event) =>
                onUpdate(day.value, { slotDuration: Number(event.target.value) })
              }
              className="h-10 w-full rounded-xl border border-hairline bg-white px-3 text-sm focus:border-primary focus:outline-none"
            >
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={45}>45 phút</option>
              <option value={60}>60 phút</option>
            </select>
          </Field>
          <Field label="Số bệnh nhân/slot">
            <input
              type="number"
              min={1}
              max={10}
              value={item.maxPatients}
              onChange={(event) => onUpdate(day.value, { maxPatients: Number(event.target.value) })}
              className="h-10 w-full rounded-xl border border-hairline bg-white px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  )
}
