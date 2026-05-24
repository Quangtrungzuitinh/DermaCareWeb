"use client"

import { BookingTriggerButton } from "./BookingTriggerButton"

export function CTABandSection() {
  return (
    <section className="bg-navy py-16 px-[5%] text-center">
      <h2 className="text-[32px] font-[800] text-white mb-3 tracking-[-0.5px]">
        Sẵn sàng bắt đầu hành trình chăm sóc da?
      </h2>
      <p className="mb-8 text-[16px] text-white/70">
        Đặt lịch ngay hôm nay — slot có thể đầy nhanh
      </p>
      <BookingTriggerButton variant="cta" />
    </section>
  )
}
