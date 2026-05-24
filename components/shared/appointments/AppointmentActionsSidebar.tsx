"use client"

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
import { formatAppointmentDate, formatVND } from "@/lib/format"
import { AppointmentStatus } from "@/lib/generated/prisma"
import type { usePaymentActions } from "@/hooks/usePaymentActions"
import type { useClinicalActions } from "@/hooks/useClinicalActions"
import type { useGuestLinkActions } from "@/hooks/useGuestLinkActions"
import type { UiAppointment } from "@/services/clinic.types"

type SidebarFlags = {
  canConfirmPresence: boolean
  canConfirm: boolean
  canReject: boolean
  canLinkGuest: boolean
  canEditClinical: boolean
  visitStarted: boolean
  allowClinicalActions: boolean
}

export function AppointmentActionsSidebar({
  appointment,
  patientName,
  treatmentTotal,
  paymentActions,
  clinicalActions,
  guestActions,
  onOpenChange,
  flags,
}: {
  appointment: UiAppointment
  patientName: string
  treatmentTotal: number
  paymentActions: ReturnType<typeof usePaymentActions>
  clinicalActions: ReturnType<typeof useClinicalActions>
  guestActions: ReturnType<typeof useGuestLinkActions>
  onOpenChange: (open: boolean) => void
  flags: SidebarFlags
}) {
  const {
    isPending: paymentPending,
    error,
    rejectConfirmOpen,
    setRejectConfirmOpen,
    cancelReason,
    setCancelReason,
    waitlistPrompt,
    setWaitlistPrompt,
    handleConfirmPayment,
    handleCancelAppointment,
    handleNotifyWaitlist,
  } = paymentActions

  const { isPending: clinicalPending, error: clinicalError, handleComplete, handleConfirmPresence } =
    clinicalActions

  const { isPending: guestPending, guestIdentifier, setGuestIdentifier, linkGuestMessage, handleLinkGuest } =
    guestActions

  const { canConfirmPresence, canConfirm, canReject, canLinkGuest, canEditClinical, visitStarted, allowClinicalActions } =
    flags

  return (
    <aside className="space-y-4">
      {canConfirmPresence && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <div className="text-sm font-semibold text-cyan-950">Xác nhận bệnh nhân có mặt</div>
          <p className="mt-1 text-xs leading-relaxed text-cyan-800">
            Bác sĩ cần xác nhận bệnh nhân đã có mặt trước khi ghi hồ sơ, kê thuốc hoặc tải ảnh da.
          </p>
          <button
            type="button"
            onClick={handleConfirmPresence}
            disabled={clinicalPending}
            className="mt-3 h-10 w-full rounded-full bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
          >
            Bệnh nhân đã có mặt
          </button>
          {clinicalError && <p className="mt-2 text-xs text-red-700">{clinicalError}</p>}
        </div>
      )}

      {allowClinicalActions &&
        appointment.status === AppointmentStatus.CONFIRMED &&
        !canConfirmPresence && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Cần xác nhận bệnh nhân có mặt trước khi ghi hồ sơ.
          </div>
        )}

      <div className="rounded-2xl border border-hairline-muted p-4">
        <div className="text-sm font-semibold text-ink">Thanh toán cọc</div>
        <div className="mt-3 space-y-2 text-sm">
          <DetailRow label="Cọc phí" value={formatVND(appointment.baseFee)} />
          <DetailRow label="Trạng thái" value={appointment.payment ? "Đã xác nhận" : "Chưa có"} />
          <DetailRow
            label="Số tiền"
            value={formatVND(appointment.payment?.amount ?? appointment.baseFee)}
          />
          {appointment.payment?.confirmedAt && (
            <DetailRow
              label="Xác nhận lúc"
              value={formatAppointmentDate(appointment.payment.confirmedAt, "dd/MM/yyyy HH:mm")}
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-hairline-muted p-4">
        <div className="text-sm font-semibold text-ink">Tổng dịch vụ</div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted">Tạm tính</span>
          <span className="text-base font-bold text-ink">
            {formatVND(appointment.baseFee + treatmentTotal)}
          </span>
        </div>
      </div>

      {canLinkGuest && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-sm font-semibold text-ink">Nối hồ sơ khách</div>
          <p className="mt-1 text-xs text-muted">
            Tìm tài khoản bệnh nhân bằng SĐT hoặc email để nối lịch và hồ sơ y tế.
          </p>
          <input
            value={guestIdentifier}
            onChange={(e) => setGuestIdentifier(e.target.value)}
            placeholder={appointment.guestPhone ?? appointment.guestEmail ?? "SĐT hoặc email"}
            className="mt-3 h-10 w-full rounded-full border border-blue-200 bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleLinkGuest}
            disabled={guestPending}
            className="mt-3 h-9 w-full rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            Nối với bệnh nhân
          </button>
          {linkGuestMessage && <p className="mt-2 text-xs text-muted">{linkGuestMessage}</p>}
        </div>
      )}

      {canEditClinical && visitStarted && (
        <div className="rounded-2xl border border-green-200 p-4">
          <div className="text-sm font-semibold text-ink">Chốt ca khám</div>
          <button
            type="button"
            onClick={handleComplete}
            disabled={clinicalPending}
            className="mt-3 h-10 w-full rounded-full bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hoàn thành ca khám
          </button>
          {clinicalError && <p className="mt-2 text-xs text-red-700">{clinicalError}</p>}
        </div>
      )}

      {(canConfirm || canReject) && (
        <div className="rounded-2xl border border-hairline-muted p-4">
          <div className="text-sm font-semibold text-ink">Thao tác</div>
          <div className="mt-3 grid gap-2">
            {canConfirm && (
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentPending}
                className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                Xác nhận
              </button>
            )}
            {canReject && (
              <button
                type="button"
                onClick={() => setRejectConfirmOpen(true)}
                disabled={paymentPending}
                className="h-10 rounded-full border border-red-300 px-4 text-sm font-semibold text-danger transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Từ chối
              </button>
            )}
          </div>
          {error && <div className="mt-3 text-xs text-red-700">{error}</div>}
        </div>
      )}

      {waitlistPrompt && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">Slot vừa được giải phóng</div>
          <p className="mt-1 text-xs text-amber-800">
            Thông báo cho bệnh nhân tiếp theo trong hàng chờ?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleNotifyWaitlist}
              disabled={paymentPending}
              className="h-8 rounded-full bg-amber-600 px-4 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
            >
              Thông báo hàng chờ
            </button>
            <button
              type="button"
              onClick={() => {
                setWaitlistPrompt(false)
                onOpenChange(false)
              }}
              disabled={paymentPending}
              className="h-8 rounded-full border border-amber-300 px-4 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
            >
              Bỏ qua
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        </div>
      )}

      <AlertDialog
        open={rejectConfirmOpen}
        onOpenChange={(open) => {
          setRejectConfirmOpen(open)
          if (!open) setCancelReason("")
        }}
      >
        <AlertDialogContent className="rounded-3xl border border-hairline-muted bg-white p-0 shadow-modal sm:max-w-md">
          <div className="p-5">
            <AlertDialogHeader className="place-items-start gap-2 text-left">
              <AlertDialogTitle className="text-lg font-bold text-ink">
                Xác nhận hủy lịch hẹn
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-muted">
                Lịch hẹn của <span className="font-semibold text-ink">{patientName}</span> sẽ bị
                hủy. Bệnh nhân sẽ nhận thông báo kèm lý do.
              </AlertDialogDescription>
            </AlertDialogHeader>
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
          </div>
          <AlertDialogFooter className="m-0 flex-row justify-end gap-2 rounded-b-3xl border-t border-hairline-muted bg-surface-soft p-4">
            <AlertDialogCancel className="h-10 rounded-full border border-hairline bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-hairline-soft">
              Không
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!cancelReason.trim() || paymentPending}
              onClick={handleCancelAppointment}
              className="h-10 rounded-full bg-danger px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Hủy lịch hẹn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  )
}
