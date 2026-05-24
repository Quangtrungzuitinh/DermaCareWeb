import type { ComponentType, SVGProps } from "react"

export const ACCENT = "#dbeafe"
export const ACCENT_FG = "#1d4ed8"
export const DARK = "#0f2a3f"

export function SoftCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white rounded-3xl border border-hairline-muted shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)] ${className}`}
    >
      {children}
    </div>
  )
}

export function IconChip({ icon: Icon }: { icon: ComponentType<SVGProps<SVGSVGElement>> }) {
  return (
    <span
      className="h-10 w-10 rounded-full inline-flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: ACCENT, color: ACCENT_FG }}
    >
      <Icon className="h-5 w-5" />
    </span>
  )
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-hairline-soft px-2.5 py-1 text-[11px] font-medium text-muted whitespace-nowrap">
      {children}
    </span>
  )
}

export function StatHead({
  icon,
  label,
  value,
  pill,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: string
  pill: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <IconChip icon={icon} />
        <div className="min-w-0">
          <div className="text-xs text-muted">{label}</div>
          <div className="text-xl font-bold tracking-tight truncate" style={{ color: DARK }}>
            {value}
          </div>
        </div>
      </div>
      <Pill>{pill}</Pill>
    </div>
  )
}

export function StatRow({
  icon,
  label,
  value,
  pill,
  small,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: string
  pill: string
  small?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <IconChip icon={icon} />
        <div className="min-w-0">
          <div className="text-xs text-muted">{label}</div>
          <div
            className={`font-bold tracking-tight truncate ${small ? "text-base" : "text-lg"}`}
            style={{ color: DARK }}
          >
            {value}
          </div>
        </div>
      </div>
      <Pill>{pill}</Pill>
    </div>
  )
}
