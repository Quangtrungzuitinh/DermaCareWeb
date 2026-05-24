import type { LucideIcon } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { PanelCard } from "@/components/shared/PanelCard"
import { TZ } from "@/lib/format"

const DARK = "#0f2a3f"
const HIGHLIGHT = "#2563eb"

export function DashboardBarCard({
  icon: Icon,
  label,
  value,
  updatedLabel,
  bars,
  barColor,
  barOpacityEmpty,
}: {
  icon: LucideIcon
  label: string
  value: string
  updatedLabel: string
  bars: { date: Date; value: number }[]
  barColor: string
  barOpacityEmpty: number
}) {
  const max = Math.max(...bars.map((b) => b.value), 1)

  return (
    <PanelCard>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary-hover">
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="text-xs text-muted">{label}</div>
            <div className="truncate text-2xl font-bold tracking-tight text-ink">{value}</div>
          </div>
        </div>
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-hairline-soft px-3 py-1.5 text-[10px] font-medium text-slate-600">
          {updatedLabel}
        </span>
      </div>
      <div className="flex h-28 items-end gap-2">
        {bars.map((bar, index) => {
          const isLast = index === bars.length - 1
          return (
            <div key={bar.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full origin-bottom rounded-full transition-transform duration-200 hover:scale-y-105"
                style={{
                  height: `${Math.max((bar.value / max) * 100, 12)}%`,
                  background: isLast ? HIGHLIGHT : barColor,
                  opacity: bar.value === 0 ? barOpacityEmpty : 1,
                }}
              />
              <div className="text-[9px] text-muted-soft">
                {formatInTimeZone(bar.date, TZ, "dd/MM")}
              </div>
            </div>
          )
        })}
      </div>
    </PanelCard>
  )
}

export { DARK, HIGHLIGHT }
