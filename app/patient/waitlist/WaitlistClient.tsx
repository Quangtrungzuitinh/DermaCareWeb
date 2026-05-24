"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Clock } from "lucide-react"
import { PatientShell } from "@/components/patient/PatientShell"
import { WaitlistStatusBadge } from "@/components/patient/WaitlistStatusBadge"
import { cancelWaitlistEntry } from "@/lib/actions/waitlist.actions"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import type { UiWaitlistEntry } from "@/services/clinic.types"

export function WaitlistClient({ entries }: { entries: UiWaitlistEntry[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const active = entries.filter((entry) => ["WAITING", "NOTIFIED"].includes(entry.status))
  const history = entries.filter((entry) => !["WAITING", "NOTIFIED"].includes(entry.status))

  function handleCancel(id: string) {
    setError(null)
    startTransition(async () => {
      try {
        await cancelWaitlistEntry(id)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể hủy hàng chờ.")
      }
    })
  }

  return (
    <PatientShell title="Danh sách chờ" description={`${active.length} đăng ký đang hoạt động`}>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {entries.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-hairline bg-white py-16 text-center">
            <Clock className="h-10 w-10 text-muted-soft" />
            <p className="text-sm font-semibold text-muted">Bạn chưa đăng ký hàng chờ nào.</p>
          </div>
        )}

        {active.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-soft">
              Đang chờ
            </h2>
            {active.map((entry) => (
              <WaitlistCard
                key={entry.id}
                entry={entry}
                isPending={isPending}
                onCancel={handleCancel}
              />
            ))}
          </section>
        )}

        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-soft">
              Lịch sử
            </h2>
            {history.map((entry) => (
              <WaitlistCard key={entry.id} entry={entry} isPending={isPending} />
            ))}
          </section>
        )}
      </div>
    </PatientShell>
  )
}

function WaitlistCard({
  entry,
  isPending,
  onCancel,
}: {
  entry: UiWaitlistEntry
  isPending: boolean
  onCancel?: (id: string) => void
}) {
  const canCancel = onCancel && ["WAITING", "NOTIFIED"].includes(entry.status)

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-hairline bg-white p-4 shadow-sm">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{entry.serviceName}</span>
          <WaitlistStatusBadge status={entry.status} />
        </div>
        <div className="text-sm text-muted">{formatVND(entry.servicePrice)} / buổi</div>
        {entry.preferredDoctorName && (
          <div className="text-sm text-muted">Ưu tiên: BS. {entry.preferredDoctorName}</div>
        )}
        {entry.notes && <div className="text-sm text-muted">Ghi chú: {entry.notes}</div>}
        {entry.expiresAt && entry.status === "NOTIFIED" && (
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
            <Clock className="h-3 w-3" />
            Hết hạn: {formatAppointmentDate(entry.expiresAt, "dd/MM/yyyy HH:mm")}
          </div>
        )}
        {entry.notifiedAt && (
          <div className="text-xs font-semibold text-green-600">
            Đã thông báo: {formatAppointmentDate(entry.notifiedAt, "dd/MM/yyyy HH:mm")}
          </div>
        )}
        <div className="text-xs text-muted-soft">
          Đăng ký: {formatAppointmentDate(entry.createdAt, "dd/MM/yyyy HH:mm")}
        </div>
      </div>

      {canCancel && (
        <button
          type="button"
          onClick={() => onCancel(entry.id)}
          disabled={isPending}
          className="shrink-0 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hủy
        </button>
      )}
    </div>
  )
}
