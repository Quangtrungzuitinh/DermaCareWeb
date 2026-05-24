import type { ComponentType, SVGProps } from "react"

interface Props {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: string
  updatedLabel?: string
  tone?: "blue" | "amber" | "green" | "slate"
}

const TONES = {
  blue: "bg-primary-light text-primary-hover",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-700",
  slate: "bg-hairline-soft text-slate-600",
} as const

export function InsightCard({ icon: Icon, label, value, updatedLabel, tone = "blue" }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-hairline-muted bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-light hover:shadow-elevated md:p-5">
      <span
        className={`h-12 w-12 rounded-2xl inline-flex items-center justify-center flex-shrink-0 ${TONES[tone]}`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-muted">{label}</div>
        <div className="mt-0.5 truncate text-2xl font-bold tracking-tight text-ink">{value}</div>
      </div>
      {updatedLabel && (
        <span className="hidden whitespace-nowrap rounded-full bg-hairline-soft px-3 py-1.5 text-[11px] font-medium text-slate-600 sm:inline-flex sm:items-center">
          {updatedLabel}
        </span>
      )}
    </div>
  )
}
