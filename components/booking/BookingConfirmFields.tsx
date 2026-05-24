"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export function formatVNDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`
}

export function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function ReadField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-soft p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-soft">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="truncate text-sm font-semibold text-ink">{value}</div>
    </div>
  )
}

export function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-hairline bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-blue-200"
      />
    </label>
  )
}

export function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-hairline pt-3 first:border-t-0 first:pt-0">
      <span className="text-muted">{label}</span>
      <span
        className={`text-right ${strong ? "text-base font-black text-danger" : "font-bold text-ink"}`}
      >
        {value}
      </span>
    </div>
  )
}
