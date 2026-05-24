"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface Props {
  open: boolean
  onClose: () => void
}

export function BookingChoiceModal({ open, onClose }: Props) {
  const router = useRouter()

  const continueAsGuest = () => {
    try {
      sessionStorage.removeItem("guestInfo")
      sessionStorage.setItem("bookingMode", "guest")
    } catch {}
    onClose()
    router.push("/booking/select")
  }

  const continueAsMember = () => {
    onClose()
    router.push("/auth/login")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden rounded-[20px] border-0 bg-white p-0 shadow-modal sm:max-w-[440px]">
        <div className="px-7 pt-7">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-[800] tracking-[-0.3px] text-ink">
              Đặt lịch khám
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[14px] text-muted">
              Chọn cách tiếp tục đặt lịch tại phòng khám.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-7 pb-7 pt-5">
          <button
            type="button"
            onClick={continueAsGuest}
            className="group w-full rounded-xl border-2 border-hairline bg-white p-5 text-left transition-all duration-200 hover:border-teal-600 hover:shadow-card"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 transition-colors group-hover:bg-teal-100">
                <svg
                  className="h-5 w-5 text-teal-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="mb-0.5 text-[14px] font-bold text-ink">Khách vãng lai</div>
                <div className="text-[13px] leading-[1.5] text-muted">
                  Đi thẳng vào luồng đặt lịch. Thông tin người khám sẽ nhập ở bước xác nhận.
                </div>
              </div>
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-muted-soft transition-colors group-hover:text-teal-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <span className="mt-4 flex h-[42px] w-full items-center justify-center rounded-lg bg-teal-600 text-[13.5px] font-semibold text-white transition-colors duration-150 group-hover:bg-teal-700">
              Đặt lịch với tư cách khách
            </span>
          </button>

          <button
            type="button"
            onClick={continueAsMember}
            className="group w-full rounded-xl border-2 border-hairline bg-white p-5 text-left transition-all duration-200 hover:border-navy hover:shadow-card"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-light transition-colors group-hover:bg-surface-strong">
                <svg
                  className="h-5 w-5 text-navy"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="mb-0.5 text-[14px] font-bold text-ink">Khách quen</div>
                <div className="text-[13px] leading-[1.5] text-muted">
                  Đăng nhập tài khoản để dùng thông tin hồ sơ và quản lý lịch hẹn.
                </div>
              </div>
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-muted-soft transition-colors group-hover:text-navy"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <span className="mt-4 flex h-[42px] w-full items-center justify-center rounded-lg bg-navy text-[13.5px] font-semibold text-white transition-colors duration-150 group-hover:bg-navy-dark">
              Đăng nhập tài khoản
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
