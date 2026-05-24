"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatVND } from "@/lib/format"
import type { AppointmentStatus } from "@/lib/generated/prisma"

type PendingAction = "cancel" | "noshow" | null

export function StaffAppointmentActionsClient({
  status,
  payment,
  baseFee,
  confirmAction,
  checkInAction,
  cancelAction,
  noShowAction,
  linkGuestAction,
  canLinkGuest = false,
  defaultGuestIdentifier = "",
}: {
  status: AppointmentStatus
  payment: { amount: number; confirmedAt: string | null } | null
  baseFee: number
  confirmAction: () => Promise<void>
  checkInAction: () => Promise<void>
  cancelAction: (reason: string) => Promise<void>
  noShowAction: () => Promise<void>
  linkGuestAction?: (identifier: string) => Promise<{ success: boolean }>
  canLinkGuest?: boolean
  defaultGuestIdentifier?: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState<PendingAction>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [guestIdentifier, setGuestIdentifier] = useState(defaultGuestIdentifier)
  const [linkMessage, setLinkMessage] = useState("")
  const [isRunning, startTransition] = useTransition()

  function handleOpenChange(open: boolean) {
    if (!open) {
      setPending(null)
      setCancelReason("")
    }
  }

  function confirm() {
    if (!pending) return
    if (pending === "cancel") {
      const reason = cancelReason.trim()
      if (!reason) return
      setPending(null)
      setCancelReason("")
      startTransition(() => cancelAction(reason))
    } else {
      setPending(null)
      startTransition(() => noShowAction())
    }
  }

  function linkGuest() {
    if (!linkGuestAction) return
    const value = guestIdentifier.trim()
    if (!value) {
      setLinkMessage("Nhập SĐT hoặc email của tài khoản bệnh nhân.")
      return
    }
    setLinkMessage("")
    startTransition(async () => {
      try {
        await linkGuestAction(value)
        setLinkMessage("Đã nối khách vãng lai với hồ sơ bệnh nhân.")
        router.refresh()
      } catch (error) {
        setLinkMessage(error instanceof Error ? error.message : "Không thể nối hồ sơ.")
      }
    })
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-ink">Thanh toán cọc</h3>
      <div className="mt-4 rounded-2xl bg-surface-soft p-4 text-sm">
        <div className="flex justify-between">
          <span>Trạng thái</span>
          <span>{payment ? "Đã xác nhận" : "Chưa có"}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span>Số tiền</span>
          <span>{formatVND(payment?.amount ?? baseFee)}</span>
        </div>
        {payment?.confirmedAt && (
          <div className="mt-2 text-xs text-muted">Xác nhận lúc {payment.confirmedAt}</div>
        )}
      </div>

      {!payment && status === "PENDING_PAYMENT" && (
        <form action={confirmAction} className="mt-4">
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Xác nhận đã thu cọc
          </button>
        </form>
      )}

      {payment && status === "CONFIRMED" && (
        <form action={checkInAction} className="mt-4">
          <button
            type="submit"
            className="w-full rounded-full bg-[#0891b2] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0e7490]"
          >
            Check-in bệnh nhân
          </button>
        </form>
      )}

      {status === "CHECKED_IN" && (
        <div className="mt-4 rounded-2xl bg-[#ecfeff] px-4 py-3 text-sm font-semibold text-[#0e7490]">
          Bệnh nhân đã check-in, bác sĩ có thể ghi hồ sơ khám.
        </div>
      )}

      {canLinkGuest && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-sm font-semibold text-ink">Nối hồ sơ khách</div>
          <p className="mt-1 text-xs text-muted">
            Tìm tài khoản bệnh nhân bằng SĐT hoặc email để nối lịch và hồ sơ y tế.
          </p>
          <input
            value={guestIdentifier}
            onChange={(event) => setGuestIdentifier(event.target.value)}
            placeholder="SĐT hoặc email"
            className="mt-3 h-10 w-full rounded-full border border-blue-200 bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={isRunning}
            onClick={linkGuest}
            className="mt-3 h-9 w-full rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            Nối với bệnh nhân
          </button>
          {linkMessage && <p className="mt-2 text-xs text-muted">{linkMessage}</p>}
        </div>
      )}

      {(status === "CONFIRMED" || status === "PENDING_PAYMENT") && (
        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setPending("noshow")}
            className="w-full rounded-full border border-hairline px-4 py-2.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-surface-soft disabled:opacity-50"
          >
            Đánh dấu không đến
          </button>
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setPending("cancel")}
            className="w-full rounded-full border border-[#fca5a5] px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-[#fef2f2] disabled:opacity-50"
          >
            {isRunning ? "Đang xử lý..." : "Hủy lịch hẹn"}
          </button>
        </div>
      )}

      <AlertDialog open={pending !== null} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="rounded-3xl border border-hairline-muted bg-white p-0 shadow-[0_18px_60px_rgba(15,23,42,0.16)] sm:max-w-md">
          <div className="p-5">
            <AlertDialogHeader className="place-items-start gap-2 text-left">
              <AlertDialogTitle className="text-lg font-bold text-ink">
                {pending === "cancel" ? "Xác nhận hủy lịch hẹn" : "Xác nhận không đến"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-muted">
                {pending === "cancel"
                  ? "Bệnh nhân sẽ nhận thông báo kèm lý do hủy. Thao tác này không thể hoàn tác."
                  : "Lịch hẹn sẽ được đánh dấu là bệnh nhân không đến. Thao tác này không thể hoàn tác."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {pending === "cancel" && (
              <label className="mt-4 block text-sm text-body">
                <span className="mb-1.5 block font-semibold">
                  Lý do hủy <span className="text-danger">*</span>
                </span>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="VD: Bác sĩ bận đột xuất, vui lòng đặt lại lịch..."
                  className="w-full rounded-2xl border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted-soft focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                {!cancelReason.trim() && (
                  <span className="mt-1 block text-xs text-danger">
                    Cần nhập lý do trước khi hủy lịch.
                  </span>
                )}
              </label>
            )}
          </div>
          <AlertDialogFooter className="m-0 flex-row justify-end gap-2 rounded-b-3xl border-t border-hairline-muted bg-surface-soft p-4">
            <AlertDialogCancel className="h-10 rounded-full border border-hairline bg-white px-5 text-sm font-semibold text-[#475569] transition hover:bg-hairline-soft">
              Không
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm}
              disabled={pending === "cancel" && !cancelReason.trim()}
              className={`h-10 rounded-full px-5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                pending === "cancel" ? "bg-danger hover:bg-[#b91c1c]" : "bg-[#475569] hover:bg-body"
              }`}
            >
              {pending === "cancel" ? "Hủy lịch hẹn" : "Xác nhận không đến"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
