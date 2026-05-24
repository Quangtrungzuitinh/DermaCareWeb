"use client"

import { ArrowRight } from "lucide-react"
import { Card, Divider, SectionLabel, SummaryItem } from "@/components/booking/BookingSelectParts"
import type { useBookingSelectState } from "@/components/booking/useBookingSelectState"
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants"
import { formatVND } from "@/lib/format"

type BookingState = ReturnType<typeof useBookingSelectState>

export function BookingSelectSummary({ booking }: { booking: BookingState }) {
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
      <Card>
        <SectionLabel>Tóm tắt lịch khám</SectionLabel>
        <div className="space-y-3.5 rounded-2xl border border-hairline bg-surface-soft p-4">
          <SummaryItem
            label={booking.method === "doctor" ? "Bác sĩ" : "Dịch vụ"}
            primary={
              booking.method === "doctor"
                ? booking.selectedDoctor
                  ? `BS. ${booking.selectedDoctor.profile.fullName}`
                  : "Chưa chọn"
                : (booking.selectedService?.name ?? "Chưa chọn")
            }
            secondary={
              booking.method === "doctor"
                ? (booking.selectedDoctor?.specialty ?? undefined)
                : booking.selectedService
                  ? formatVND(booking.selectedService.price)
                  : undefined
            }
          />
          <Divider />
          <SummaryItem
            label="Ngày khám"
            primary={booking.selectedDateDisplay}
            secondary={
              booking.selectedDate && booking.selectedSlot
                ? `${booking.selectedDateDisplay} · ${booking.selectedSlot}`
                : booking.selectedSlot
            }
          />
          <Divider />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">
              Đặt cọc
            </div>
            <div className="mt-1 text-xl font-black text-primary">
              {formatVND(APPOINTMENT_DEPOSIT_AMOUNT)}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Mô tả triệu chứng</SectionLabel>
        <textarea
          rows={4}
          placeholder="Mô tả triệu chứng hoặc lý do tới khám (không bắt buộc)..."
          value={booking.symptoms}
          onChange={(event) => booking.setSymptoms(event.target.value)}
          className="min-h-[96px] w-full resize-none rounded-xl border border-hairline bg-white p-3 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-primary focus:ring-2 focus:ring-primary-light"
        />
      </Card>

      <button
        type="button"
        disabled={!booking.canContinue}
        onClick={booking.continueConfirm}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted-soft disabled:shadow-none"
      >
        Xác nhận đặt lịch <ArrowRight className="h-4 w-4" />
      </button>
      <p className="-mt-2 text-center text-[11px] text-muted">
        Thanh toán đặt cọc {formatVND(APPOINTMENT_DEPOSIT_AMOUNT)} sau xác nhận
      </p>
    </aside>
  )
}
