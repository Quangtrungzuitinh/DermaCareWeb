"use client"

import { CalendarPlus } from "lucide-react"

export function ReportFilters({
  from,
  to,
  error,
  onFromChange,
  onToChange,
  onCreateReport,
}: {
  from: string
  to: string
  error: string | null
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onCreateReport: () => void
}) {
  return (
    <div className="rounded-3xl border border-hairline-muted bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
            Từ ngày
          </span>
          <input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-hairline bg-white px-3 text-sm font-medium text-ink outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
            Đến ngày
          </span>
          <input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-hairline bg-white px-3 text-sm font-medium text-ink outline-none transition focus:border-primary"
          />
        </label>
        <button
          type="button"
          onClick={onCreateReport}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-[#1e293b]"
        >
          <CalendarPlus className="h-4 w-4" />
          Tạo báo cáo
        </button>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}
    </div>
  )
}
