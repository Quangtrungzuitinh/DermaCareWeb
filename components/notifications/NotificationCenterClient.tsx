"use client"

import { useMemo, useState, useTransition, type ReactNode } from "react"
import { Megaphone, Search, Send, Trash2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { ListPagination, type PageSize } from "@/components/shared/ListPagination"
import { PanelCard } from "@/components/shared/PanelCard"
import { SortButton, type SortOption } from "@/components/shared/SortButton"
import {
  markNotificationReadAction,
  revokeNotificationAction,
  sendBroadcastAction,
  sendManualNotificationAction,
} from "@/lib/actions/notification.actions"
import { formatAppointmentDate } from "@/lib/format"
import type { Role } from "@/lib/generated/prisma"
import type { UiAppointment, UiNotification, UiProfile } from "@/services/clinic.types"

type Mode = "ADMIN" | "STAFF" | "READONLY"
type NotificationSort = "newest" | "oldest" | "unread" | "role"

const SORT_OPTIONS: SortOption<NotificationSort>[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "unread", label: "Chưa đọc" },
  { value: "role", label: "Vai trò" },
]

const ROLE_LABELS: Record<Role | "ALL", string> = {
  ALL: "Toàn hệ thống",
  PATIENT: "Bệnh nhân",
  DOCTOR: "Bác sĩ",
  STAFF: "Nhân viên",
  ADMIN: "Quản trị",
}

export function NotificationCenterClient({
  mode,
  notifications,
  recipients = [],
  appointments = [],
}: {
  mode: Mode
  notifications: UiNotification[]
  recipients?: UiProfile[]
  appointments?: UiAppointment[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<NotificationSort>("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = q
      ? notifications.filter((item) =>
          [item.title, item.body, item.recipientName, item.senderName, item.recipientRole]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : notifications

    return source.slice().sort((a, b) => {
      if (sort === "oldest") return +new Date(a.createdAt) - +new Date(b.createdAt)
      if (sort === "unread") return Number(a.isRead) - Number(b.isRead)
      if (sort === "role")
        return ROLE_LABELS[a.recipientRole].localeCompare(ROLE_LABELS[b.recipientRole], "vi")
      return +new Date(b.createdAt) - +new Date(a.createdAt)
    })
  }, [notifications, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const canSendManual = mode === "ADMIN" || mode === "STAFF"
  const canBroadcast = mode === "ADMIN"

  const revoke = (id: string) => {
    startTransition(async () => {
      await revokeNotificationAction(id)
      window.location.reload()
    })
  }

  const openNotification = (item: UiNotification) => {
    if (!item.href) return
    startTransition(async () => {
      if (!item.isRead) await markNotificationReadAction(item.id)
      router.push(item.href!)
    })
  }

  return (
    <div className="space-y-5">
      {(canBroadcast || canSendManual) && (
        <section className="grid gap-5 lg:grid-cols-2">
          {canBroadcast && (
            <NotificationFormShell
              action={sendBroadcastAction}
              icon={Megaphone}
              title="Broadcast theo role"
              description="Admin gửi cho role hoặc toàn hệ thống."
              submitLabel="Gửi broadcast"
            >
              <NotificationSelect name="target">
                <>
                  {(["ALL", "PATIENT", "DOCTOR", "STAFF"] as const).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </>
              </NotificationSelect>
              <NotificationTextInput name="title" placeholder="Tiêu đề" />
              <NotificationTextarea name="body" placeholder="Nội dung thông báo" />
            </NotificationFormShell>
          )}

          {canSendManual && (
            <NotificationFormShell
              action={sendManualNotificationAction}
              icon={Send}
              title="Gửi cho 1 người cụ thể"
              description="Staff chỉ gửi cho Patient/Doctor; Doctor/Patient chỉ nhận."
              tone="slate"
              submitLabel="Gửi thông báo"
            >
              <NotificationSelect name="recipientId" required>
                <>
                  <option value="">Chọn người nhận</option>
                  {recipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.fullName} · {ROLE_LABELS[recipient.role]}
                    </option>
                  ))}
                </>
              </NotificationSelect>
              <NotificationSelect name="appointmentId">
                <>
                  <option value="">Không gắn lịch hẹn</option>
                  {appointments.slice(0, 80).map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      #{appointment.id.slice(-6).toUpperCase()} ·{" "}
                      {formatAppointmentDate(appointment.appointmentDate, "dd/MM HH:mm")}
                    </option>
                  ))}
                </>
              </NotificationSelect>
              <NotificationTextInput name="title" placeholder="Tiêu đề" />
              <NotificationTextarea name="body" placeholder="Nội dung thông báo" />
            </NotificationFormShell>
          )}
        </section>
      )}

      <PanelCard>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm thông báo..."
              className="h-11 w-full rounded-full border border-hairline bg-white pl-9 pr-4 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <SortButton value={sort} options={SORT_OPTIONS} onChange={setSort} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="bg-surface-soft text-left text-[11px] uppercase tracking-wider text-muted-soft">
                <th className="px-5 py-3 font-semibold">Thông báo</th>
                <th className="px-5 py-3 font-semibold">Người nhận</th>
                <th className="px-5 py-3 font-semibold">Người gửi</th>
                <th className="px-5 py-3 font-semibold">Thời gian</th>
                <th className="px-5 py-3 font-semibold">Trạng thái</th>
                {(mode === "ADMIN" || mode === "STAFF") && (
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {visible.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => openNotification(item)}
                  className={`${item.revokedAt ? "opacity-50" : "hover:bg-surface-soft"} ${item.href ? "cursor-pointer" : ""}`}
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-ink">{item.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted">{item.body}</div>
                    <div
                      className={
                        item.rejectReason
                          ? "mt-1.5 inline-block rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
                          : "hidden"
                      }
                    >
                      Lý do từ chối: {item.rejectReason}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-muted-soft">
                      {item.type}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-ink">{item.recipientName}</div>
                    <div className="text-xs text-muted">{ROLE_LABELS[item.recipientRole]}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{item.senderName ?? "Hệ thống"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {formatAppointmentDate(item.createdAt, "HH:mm dd/MM/yyyy")}
                  </td>
                  <td className="px-5 py-4">
                    {item.revokedAt ? (
                      <span className="rounded-full bg-[#fee2e2] px-2.5 py-1 text-xs font-semibold text-[#991b1b]">
                        Đã thu hồi
                      </span>
                    ) : item.isRead ? (
                      <span className="rounded-full bg-hairline-soft px-2.5 py-1 text-xs font-semibold text-muted">
                        Đã đọc
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-blue-900">
                        Chưa đọc
                      </span>
                    )}
                  </td>
                  {(mode === "ADMIN" || mode === "STAFF") && (
                    <td className="px-5 py-4 text-right">
                      {!item.revokedAt && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={(event) => {
                            event.stopPropagation()
                            revoke(item.id)
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-200 px-3 text-xs font-semibold text-danger transition hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Thu hồi
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={mode === "READONLY" ? 5 : 6}
                    className="px-5 py-12 text-center text-muted"
                  >
                    Chưa có thông báo phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ListPagination
          total={filtered.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="thông báo"
        />
      </PanelCard>
    </div>
  )
}

function NotificationFormShell({
  action,
  icon: Icon,
  title,
  description,
  submitLabel,
  children,
  tone = "blue",
}: {
  action: (formData: FormData) => void | Promise<void>
  icon: LucideIcon
  title: string
  description: string
  submitLabel: string
  children: ReactNode
  tone?: "blue" | "slate"
}) {
  const iconTone =
    tone === "blue" ? "bg-primary-light text-primary" : "bg-hairline-soft text-slate-600"

  return (
    <form
      action={action}
      className="rounded-3xl border border-hairline-muted bg-white p-5 shadow-card"
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${iconTone}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold text-ink">{title}</h3>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="grid gap-3">
        {children}
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover">
          <Send className="h-4 w-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function NotificationSelect({
  name,
  required,
  children,
}: {
  name: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <select
      name={name}
      required={required}
      className="h-11 rounded-xl border border-hairline px-3 text-sm outline-none focus:border-primary"
    >
      {children}
    </select>
  )
}

function NotificationTextInput({ name, placeholder }: { name: string; placeholder: string }) {
  return (
    <input
      name={name}
      required
      placeholder={placeholder}
      className="h-11 rounded-xl border border-hairline px-3 text-sm outline-none focus:border-primary"
    />
  )
}

function NotificationTextarea({ name, placeholder }: { name: string; placeholder: string }) {
  return (
    <textarea
      name={name}
      required
      rows={4}
      placeholder={placeholder}
      className="rounded-xl border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
    />
  )
}
