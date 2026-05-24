"use client"

import { BookingTriggerButton } from "./BookingTriggerButton"

export function HeroSection() {
  return (
    <section
      className="relative min-h-[92vh] overflow-hidden flex items-end px-[5%] pb-[72px]"
      style={{
        background:
          "linear-gradient(135deg, rgb(4,52,44) 0%, var(--color-navy) 50%, var(--color-navy-dark) 100%)",
      }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1400&q=80')",
        }}
      />

      <div className="relative z-[1] max-w-[640px]">
        <div
          className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-[14px] font-medium mb-6"
          style={{
            background: "rgba(255,255,255,0.12)",
            borderColor: "rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.9)",
            animation: "fadeSlideUp 0.5s ease both",
            animationDelay: "0ms",
          }}
        >
          <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
          Phòng khám chuyên nghiệp
        </div>

        <h1
          className="font-[800] text-white leading-[1.1] tracking-[-1.5px] mb-5"
          style={{
            fontSize: "clamp(40px, 5vw, 64px)",
            animation: "fadeSlideUp 0.6s ease both",
            animationDelay: "100ms",
          }}
        >
          Chăm sóc da
          <br />
          chuyên sâu
          <br />
          cho mọi người
        </h1>

        <p
          className="text-[16px] leading-[1.7] max-w-[480px] mb-8"
          style={{
            color: "rgba(255,255,255,0.7)",
            animation: "fadeSlideUp 0.5s ease both",
            animationDelay: "200ms",
          }}
        >
          Đội ngũ bác sĩ da liễu hơn 10 năm kinh nghiệm. Thiết bị hiện đại. Phác đồ điều trị cá nhân
          hóa theo từng loại da.
        </p>

        <div
          className="flex items-center gap-3"
          style={{
            animation: "fadeSlideUp 0.4s ease both",
            animationDelay: "300ms",
          }}
        >
          <BookingTriggerButton variant="primary" />
          <a
            href="#services"
            className="inline-flex h-12 items-center justify-center rounded-[10px] border-[1.5px] border-white/30 bg-transparent px-6 text-[15px] font-semibold text-white/85 no-underline transition-colors duration-150 hover:border-white/60 hover:bg-white/10"
          >
            Xem dịch vụ
          </a>
        </div>
      </div>

      <div
        className="absolute right-[5%] bottom-[72px] hidden md:flex gap-10"
        style={{
          animation: "fadeSlideUp 0.4s ease both",
          animationDelay: "500ms",
        }}
      >
        <div className="text-center">
          <div className="text-lg font-bold text-white">10+ năm</div>
          <div className="mt-1 text-xs text-white/60">Kinh nghiệm</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">Đội ngũ</div>
          <div className="mt-1 text-xs text-white/60">Bác sĩ chuyên khoa</div>
        </div>
      </div>
    </section>
  )
}
