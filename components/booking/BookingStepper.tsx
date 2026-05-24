"use client"

import { Check } from "lucide-react"

const steps = [
  { n: 1, label: "Chọn lịch" },
  { n: 2, label: "Xác nhận" },
  { n: 3, label: "Thanh toán" },
]

interface Props {
  current?: 1 | 2 | 3
  currentStep?: number
}

export function BookingStepper({ current, currentStep }: Props) {
  const activeStep = current ?? (currentStep as 1 | 2 | 3) ?? 1

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-card p-1">
      {steps.map((s, idx) => {
        const done = activeStep > s.n
        const active = activeStep === s.n
        return (
          <div key={s.n} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 transition ${
                active ? "bg-white shadow-sm" : done ? "bg-transparent" : "bg-transparent"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                  done
                    ? "bg-primary text-white"
                    : active
                      ? "bg-primary text-white"
                      : "bg-surface-strong text-muted"
                }`}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : s.n}
              </span>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  active ? "text-ink" : done ? "text-ink" : "text-muted-soft"
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && <span className="h-px w-4 bg-slate-300 sm:w-6" />}
          </div>
        )
      })}
    </div>
  )
}
