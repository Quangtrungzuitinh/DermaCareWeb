import Link from "next/link"
import { CalendarDays } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"

import { TZ } from "@/lib/format"

export function DashboardHeader({
  eyebrow,
  title,
  subtitle,
  from,
  to,
  actionHref,
  actionLabel,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  from: Date
  to: Date
  actionHref: string
  actionLabel: string
}) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm text-muted">{eyebrow}</p>
        <h2 className="text-3xl font-bold tracking-tight text-navy-dark md:text-5xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-10 items-center gap-2 rounded-full border border-hairline-muted bg-white pl-1.5 pr-4 shadow-card sm:flex">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-primary-hover">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium text-ink">
            {formatInTimeZone(from, TZ, "dd/MM/yyyy")} - {formatInTimeZone(to, TZ, "dd/MM/yyyy")}
          </span>
        </div>
        <Link
          href={actionHref}
          className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  )
}
