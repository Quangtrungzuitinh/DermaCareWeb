import { Check, Clock, Smartphone } from "lucide-react"

import { BookingLayout } from "@/components/booking/BookingLayout"
import { BankRow, PaymentSummary } from "@/components/booking/PaymentPageRows"
import { PaymentCountdown } from "@/components/payment/PaymentCountdown"
import { PaymentQR } from "@/components/payment/PaymentQR"
import { formatVND } from "@/lib/format"

export type PaymentMethod = "sepay"

export type PaymentAppointment = {
  id: string
  status: string
  createdAt: string
  baseFee: number
  appointmentDate?: string
  doctorName?: string
  payment: {
    qrUrl: string
    amount: number
    addInfo: string
    bankName: string
    accountNo: string
    accountName: string
  }
}

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  { name: string; brand: string; instructions: string[] }
> = {
  sepay: {
    name: "Chuyển khoản SePay",
    brand: "#0f172a",
    instructions: [
      "Mở ứng dụng ngân hàng và chọn quét mã QR.",
      "Kiểm tra đúng số tiền và nội dung chuyển khoản.",
      "Hệ thống sẽ tự xác nhận khi SePay gửi webhook giao dịch.",
    ],
  },
}

export function PaymentConfirmedState() {
  return (
    <BookingLayout current={3}>
      <div className="mx-auto max-w-md rounded-3xl border border-[#e2e8f0] bg-white p-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0fdf4]">
          <Check className="h-8 w-8 text-[#166534]" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-[#0f172a]">Thanh toán thành công!</h2>
        <p className="text-sm text-[#64748b]">Đang chuyển trang...</p>
      </div>
    </BookingLayout>
  )
}

export function PaymentExpiredState({
  onRetry,
  onSelectAnotherSlot,
}: {
  onRetry: () => void
  onSelectAnotherSlot: () => void
}) {
  return (
    <BookingLayout current={3}>
      <div className="mx-auto max-w-md rounded-3xl border border-[#e2e8f0] bg-white p-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fef2f2] text-2xl text-[#dc2626]">
          !
        </div>
        <h2 className="mb-5 text-xl font-bold text-[#0f172a]">Đã hết thời gian thanh toán</h2>
        <div className="mb-6 flex justify-center gap-3">
          <button
            onClick={onRetry}
            className="h-10 rounded-lg border border-[#e2e8f0] bg-white px-5 text-sm font-semibold text-[#0f172a] hover:bg-[#f7f9fc]"
          >
            Thử lại
          </button>
          <button
            onClick={onSelectAnotherSlot}
            className="h-10 rounded-lg bg-[#1e3a5f] px-5 text-sm font-semibold text-white hover:bg-[#162d4a]"
          >
            Chọn giờ khác
          </button>
        </div>
        <div className="text-xs leading-relaxed text-[#64748b]">
          Nếu đã chuyển khoản, vui lòng liên hệ phòng khám để được hỗ trợ.
        </div>
      </div>
    </BookingLayout>
  )
}

export function PaymentPendingState({
  appointment,
  method,
  minutes,
  seconds,
  remaining,
  onCopy,
}: {
  appointment: PaymentAppointment
  method: PaymentMethod
  minutes: number
  seconds: number
  remaining: number
  onCopy: (value: string) => void
}) {
  const amount = appointment.payment.amount
  const transferContent = appointment.payment.addInfo
  const meta = PAYMENT_METHOD_META[method]

  return (
    <BookingLayout current={3}>
      <div className="mx-auto w-full max-w-[1480px]">
        <main className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_370px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="min-w-0 rounded-[32px] border border-[#e2e8f0] bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] sm:p-7 lg:p-10">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#e2e8f0] bg-[#f7f9fc] text-sm font-black text-[#1e3a5f]">
                  QR
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2563eb]">
                    Quét mã để thanh toán
                  </div>
                  <div className="truncate text-base font-bold text-[#0f172a]">{meta.name}</div>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fefce8] px-3 py-1.5 text-xs font-bold text-[#854d0e]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f59e0b]" />
                Chờ thanh toán
              </span>
            </div>

            <div className="grid gap-7 lg:grid-cols-[minmax(330px,440px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(360px,480px)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col items-center">
                <div className="w-full rounded-[28px] border border-[#e2e8f0] bg-[#f7f9fc] p-5 lg:p-6">
                  <PaymentQR
                    qrUrl={appointment.payment.qrUrl}
                    amount={amount}
                    addInfo={transferContent}
                    bankName={appointment.payment.bankName}
                    accountNo={appointment.payment.accountNo}
                    accountName={appointment.payment.accountName}
                  />
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-[#64748b]">
                  <Smartphone className="h-3.5 w-3.5" /> Quét bằng app trên điện thoại
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="rounded-[28px] border border-[#e2e8f0] bg-[#f7f9fc] p-5 lg:p-6">
                  <BankRow label="Ngân hàng" value={appointment.payment.bankName || "SePay"} />
                  <BankRow
                    label="Số tài khoản"
                    value={appointment.payment.accountNo}
                    mono
                    onCopy={() => onCopy(appointment.payment.accountNo)}
                  />
                  <BankRow
                    label="Chủ tài khoản"
                    value={appointment.payment.accountName || "Phòng khám"}
                  />
                  <BankRow label="Số tiền" value={formatVND(amount)} highlight />
                  <BankRow
                    label="Nội dung chuyển khoản"
                    value={transferContent}
                    mono
                    onCopy={() => onCopy(transferContent)}
                  />
                </div>

                <div className="rounded-[28px] border border-[#e2e8f0] p-5 lg:p-6">
                  <div className="mb-4 text-base font-bold text-[#0f172a]">Hướng dẫn</div>
                  <ol className="space-y-3 text-base leading-6 text-[#475569]">
                    {meta.instructions.map((item, index) => (
                      <li key={item} className="flex gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-xs font-bold text-[#2563eb]">
                          {index + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-[28px] border border-[#fcd34d] bg-[#fff7ed] p-5 lg:p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#92400e]">
                      <Clock className="h-3.5 w-3.5" /> Thời gian còn lại
                    </span>
                  </div>
                  <PaymentCountdown minutes={minutes} seconds={seconds} remaining={remaining} />
                </div>
              </div>
            </div>
          </section>

          <PaymentSummary appointment={appointment} amount={amount} />
        </main>
      </div>
    </BookingLayout>
  )
}
