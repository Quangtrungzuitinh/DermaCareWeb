"use client"

import { useState } from "react"
import { BookingChoiceModal } from "./BookingChoiceModal"

interface Props {
  variant?: "primary" | "nav" | "cta"
}

export function BookingTriggerButton({ variant = "primary" }: Props) {
  const [showModal, setShowModal] = useState(false)

  // Nút này KHÔNG link đến /booking trực tiếp — nó mở popup [LP-02]
  if (variant === "nav") {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="h-9 rounded-lg bg-navy px-5 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-[1px] hover:bg-navy-dark"
        >
          Đặt lịch ngay
        </button>
        <BookingChoiceModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    )
  }

  // CTA band variant — white button on navy bg
  if (variant === "cta") {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="h-12 rounded-[10px] border-none bg-white px-8 text-[15px] font-bold text-navy transition-all duration-150 hover:-translate-y-[2px] hover:shadow-modal"
        >
          <span>Đặt lịch khám ngay</span>
          <svg
            viewBox="0 0 24 24"
            className="inline w-4 h-4 ml-1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <BookingChoiceModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    )
  }

  // Primary (hero) variant
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative h-12 overflow-hidden rounded-[10px] border-none bg-white px-7 text-[15px] font-bold text-navy shadow-elevated transition-all duration-150 hover:-translate-y-[2px] hover:shadow-modal"
      >
        <span
          className="absolute top-0 bottom-0 w-[60%] pointer-events-none"
          style={{
            left: "-100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            animation: "shimmer 2.5s infinite",
            animationDelay: "1s",
          }}
        />
        <span>Đặt lịch ngay</span>
        <svg
          viewBox="0 0 24 24"
          className="inline w-4 h-4 ml-1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
      <BookingChoiceModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
