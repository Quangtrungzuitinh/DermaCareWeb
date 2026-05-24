"use client"

import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import { BookingStepper } from "./BookingStepper"

interface Props {
  current: 1 | 2 | 3
  children: ReactNode
}

export function BookingLayout({ current, children }: Props) {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col">
      <header className="bg-white sticky top-0 z-20 border-b border-hairline">
        <div className="max-w-[1500px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/patient/dashboard"
            className="flex items-center gap-2 text-ink flex-shrink-0"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-xs font-black">
              D
            </div>
            <span className="font-bold tracking-tight hidden sm:inline">DermaCare</span>
          </Link>

          <div className="flex-1 flex justify-center min-w-0 overflow-x-auto">
            <BookingStepper current={current} />
          </div>

          <Link
            href="/patient/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink flex-shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-6 py-5 md:py-7">
        <div className="max-w-[1500px] mx-auto">{children}</div>
      </main>

      <footer className="border-t border-hairline bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-11 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          Giao dịch được bảo mật bởi DermaCare · Hỗ trợ 24/7
        </div>
      </footer>
    </div>
  )
}
