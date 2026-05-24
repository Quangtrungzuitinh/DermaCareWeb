"use client"

import { useEffect, useState, useTransition } from "react"
import { Bell, CheckCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getMyNotificationFeedAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notification.actions"
import { formatAppointmentDate } from "@/lib/format"
import type { UiNotification } from "@/services/clinic.types"

type Feed = Awaited<ReturnType<typeof getMyNotificationFeedAction>>

export function NotificationBell({ allHref }: { allHref: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [feed, setFeed] = useState<Feed | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = () => {
    startTransition(async () => {
      const next = await getMyNotificationFeedAction(8)
      setFeed(next)
    })
  }

  useEffect(() => {
    load()
  }, [])

  const unreadCount = feed?.unreadCount ?? 0
  const notifications = feed?.notifications ?? []

  const markOne = (notification: UiNotification) => {
    startTransition(async () => {
      if (!notification.isRead) await markNotificationReadAction(notification.id)
      await getMyNotificationFeedAction(8).then(setFeed)
      setOpen(false)
      if (notification.href) router.push(notification.href)
    })
  }

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction()
      await getMyNotificationFeedAction(8).then(setFeed)
    })
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) load()
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Thông báo"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f0f4f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/30"
        >
          <Bell className="h-[18px] w-[18px] text-[#334155]" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[360px] overflow-hidden rounded-3xl border-[#e2e8f0] bg-white p-0 shadow-[0_18px_60px_rgba(15,23,42,0.16)]"
      >
        <div className="flex items-center justify-between border-b border-[#eef2f7] px-4 py-3">
          <div>
            <div className="text-sm font-bold text-[#0f172a]">Thông báo</div>
            <div className="text-xs text-[#64748b]">{unreadCount} chưa đọc</div>
          </div>
          <button
            type="button"
            onClick={markAll}
            disabled={isPending || unreadCount === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#475569] transition hover:bg-[#dbeafe] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Đọc hết
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="rounded-2xl bg-[#f7f9fc] px-4 py-8 text-center text-sm text-[#64748b]">
              Chưa có thông báo.
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => markOne(notification)}
                className="group/notification mb-1 flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[#f7f9fc]"
              >
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.isRead ? "bg-[#cbd5e1]" : "bg-[#2563eb]"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#0f172a]">
                    {notification.title}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[#64748b]">
                    {notification.body}
                  </span>
                  <span
                    className={
                      notification.rejectReason
                        ? "mt-1.5 block rounded-lg bg-[#fef3c7] px-2.5 py-1.5 text-xs font-semibold text-[#92400e]"
                        : "hidden"
                    }
                  >
                    Lý do từ chối: {notification.rejectReason}
                  </span>
                  <span className="mt-1 block text-[11px] font-medium text-[#94a3b8]">
                    {formatAppointmentDate(notification.createdAt, "HH:mm dd/MM/yyyy")}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-[#eef2f7] p-2">
          <Link
            href={allHref}
            className="flex h-10 items-center justify-center rounded-full text-sm font-semibold text-[#2563eb] transition hover:bg-[#dbeafe]"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
