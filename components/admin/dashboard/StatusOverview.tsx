import { ArrowLinkButton } from "@/components/shared/ArrowLinkButton"
import { APPOINTMENT_STATUS_LABELS } from "@/lib/appointment-status"
import type { AppointmentStatus } from "@/lib/generated/prisma"

export function StatusOverview({
  stats,
  total,
}: {
  stats: { status: AppointmentStatus; count: number }[]
  total: number
}) {
  const max = Math.max(...stats.map((item) => item.count), 1)

  return (
    <div className="min-h-[320px] rounded-3xl border border-hairline-muted bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-ink">Tình trạng lịch hẹn</h3>
          <p className="mt-0.5 text-xs text-muted">{total} lịch trong hệ thống</p>
        </div>
        <ArrowLinkButton to="/admin/appointments" search={{ tab: "list" }} label="Mở lịch hẹn" />
      </div>
      <div className="space-y-3">
        {stats.map((item) => (
          <div key={item.status} className="group/status">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">
                {APPOINTMENT_STATUS_LABELS[item.status]}
              </span>
              <span className="text-xs font-semibold text-muted">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-hairline-soft">
              <div
                className="h-full rounded-full bg-primary transition-transform duration-200 group-hover/status:scale-x-[1.01]"
                style={{
                  width: `${Math.max((item.count / max) * 100, item.count > 0 ? 8 : 0)}%`,
                  opacity: item.count === 0 ? 0.25 : 1,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
