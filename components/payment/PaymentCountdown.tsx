interface Props {
  minutes: number
  seconds: number
  remaining: number
}

export function PaymentCountdown({ minutes, seconds, remaining }: Props) {
  const percent = Math.max(0, Math.min(100, (remaining / 900000) * 100))

  let color = "bg-[#2563eb]" // blue
  let textColor = "text-[#2563eb]"
  if (remaining <= 300000 && remaining > 120000) {
    color = "bg-[#d97706]" // amber
    textColor = "text-[#d97706]"
  } else if (remaining <= 120000) {
    color = "bg-[#dc2626]" // red
    textColor = "text-[#dc2626]"
  }

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-[#94a3b8]">Thời gian còn lại</div>
        <div className={`font-mono font-bold ${textColor}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
        <div
          className={`h-full ${color} transition-all duration-1000 ease-linear`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
