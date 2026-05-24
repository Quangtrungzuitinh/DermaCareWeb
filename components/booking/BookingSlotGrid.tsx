import type { SlotItem } from "@/types/booking"
import type { SlotGroup } from "@/components/booking/BookingSelectUtils"

export function SlotGrid({
  slots,
  loading,
  selectedSlot,
  onSelectSlot,
}: {
  slots?: SlotItem[]
  loading: boolean
  selectedSlot?: string
  onSelectSlot: (slot: string) => void
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-10 rounded-xl bg-hairline" />
        ))}
      </div>
    )
  }
  if (!slots)
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-white py-8 text-center text-xs text-muted-soft">
        Vui lòng chọn ngày khám ở bên trái
      </div>
    )
  if (slots.length === 0)
    return (
      <div className="rounded-xl bg-white py-8 text-center text-xs text-muted-soft">
        Chưa có lịch khám
      </div>
    )
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {slots.map((slot) => {
        const selected = selectedSlot === slot.label
        return (
          <button
            key={slot.label}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelectSlot(slot.label)}
            className={`h-10 rounded-xl border text-xs font-bold transition ${selected ? "border-primary bg-primary text-white shadow-card" : slot.available ? "border-hairline bg-white text-ink hover:border-primary hover:text-primary" : "border-hairline bg-slate-50 text-slate-300"}`}
          >
            {slot.label}
          </button>
        )
      })}
    </div>
  )
}

export function RangeSlotGrid({
  complete,
  groups,
  loading,
  selectedSlotKey,
  onSelectSlot,
}: {
  complete: boolean
  groups?: SlotGroup[]
  loading: boolean
  selectedSlotKey?: string
  onSelectSlot: (slot: string, date?: string) => void
}) {
  if (!complete) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-white py-8 text-center text-xs text-muted-soft">
        Chọn ngày bắt đầu và ngày kết thúc để xem khung giờ trong khoảng.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-hairline bg-white p-3">
            <div className="mb-2 h-4 w-32 rounded bg-hairline" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((__, slotIndex) => (
                <div key={slotIndex} className="h-10 rounded-xl bg-hairline" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const visibleGroups = groups?.filter((group) => group.slots.length > 0) ?? []

  if (visibleGroups.length === 0) {
    return (
      <div className="rounded-xl bg-white py-8 text-center text-xs text-muted-soft">
        Không có khung giờ trống trong khoảng ngày đã chọn.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleGroups.map((group) => (
        <div key={group.date} className="rounded-xl border border-hairline bg-white p-3">
          <div className="mb-2 text-xs font-bold text-ink">{group.label}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {group.slots.map((slot) => {
              const selected = selectedSlotKey === `${group.date}|${slot.label}`
              return (
                <button
                  key={`${group.date}-${slot.label}`}
                  type="button"
                  onClick={() => onSelectSlot(slot.label, group.date)}
                  className={`h-10 rounded-xl border text-xs font-bold transition ${
                    selected
                      ? "border-primary bg-primary text-white shadow-card"
                      : "border-hairline bg-white text-ink hover:border-primary hover:text-primary"
                  }`}
                >
                  {slot.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
