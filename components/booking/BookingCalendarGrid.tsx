import { ChevronDown, ChevronUp } from "lucide-react"
import {
  availableCount,
  fromISO,
  MONTHS_VI,
  toISO,
  WEEKDAYS,
} from "@/components/booking/BookingSelectUtils"

type Props = {
  month: Date
  today: Date
  selectedISO?: string
  rangeStartISO?: string
  rangeEndISO?: string
  onPrev: () => void
  onNext: () => void
  onPick: (date: Date) => void
}

export function CalendarGrid({
  month,
  today,
  selectedISO,
  rangeStartISO,
  rangeEndISO,
  onPrev,
  onNext,
  onPick,
}: Props) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const offset = (new Date(year, m, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, m, i + 1)),
  ]
  const rangeStart = rangeStartISO ? fromISO(rangeStartISO) : undefined
  const rangeEnd = rangeEndISO ? fromISO(rangeEndISO) : undefined

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-primary hover:bg-blue-50"
        >
          <ChevronUp className="h-4 w-4 -rotate-90" />
        </button>
        <div className="text-sm font-bold text-ink">
          {MONTHS_VI[m]}, {year}
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-primary hover:bg-blue-50"
        >
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="inline-flex h-7 items-center justify-center text-[10px] font-bold uppercase text-muted-soft"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} className="h-10" />
          const iso = toISO(date)
          const past = date < today
          const selected = iso === selectedISO
          const isStart = Boolean(rangeStart && iso === toISO(rangeStart))
          const isEnd = Boolean(rangeEnd && iso === toISO(rangeEnd))
          const inRange = Boolean(rangeStart && rangeEnd && date > rangeStart && date < rangeEnd)
          const endpoint = isStart || isEnd
          const active = endpoint || (selected && !rangeStart)
          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              onClick={() => onPick(date)}
              className={`relative flex h-10 flex-col items-center justify-center rounded-lg text-xs font-bold transition ${active ? "bg-primary text-white shadow-card" : inRange ? "bg-primary-light text-primary-hover" : past ? "cursor-not-allowed text-slate-300" : "text-ink hover:bg-blue-50"}`}
            >
              <span className="leading-none">{date.getDate()}</span>
              {!past && !active && !inRange && (
                <span
                  className={`mt-0.5 h-1 w-1 rounded-full ${availableCount(date) === 0 ? "bg-transparent" : "bg-green-500"}`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
