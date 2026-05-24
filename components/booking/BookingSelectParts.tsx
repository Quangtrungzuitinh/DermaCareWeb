import { ChevronDown, ChevronUp } from "lucide-react"
import type { ReactNode } from "react"
import { Initials } from "@/components/shared/InitialsAvatar"
import { formatVND } from "@/lib/format"
import type { Service } from "@/lib/generated/prisma"
import type { SlotItem } from "@/types/booking"
import type { DoctorWithProfile, SlotGroup } from "@/components/booking/BookingSelectUtils"
import { SlotGrid, RangeSlotGrid } from "@/components/booking/BookingSlotGrid"

export function DoctorRow({
  doctor,
  expanded,
  selected,
  aiMatch,
  dateLabel,
  slots,
  slotsLoading,
  rangeMode,
  rangeComplete,
  rangeSlots,
  rangeSlotsLoading,
  selectedSlot,
  selectedSlotKey,
  onSelect,
  onToggle,
  onSelectSlot,
}: {
  doctor: DoctorWithProfile
  expanded: boolean
  selected: boolean
  aiMatch?: boolean
  dateLabel: string
  slots?: SlotItem[]
  slotsLoading: boolean
  rangeMode: boolean
  rangeComplete: boolean
  rangeSlots?: SlotGroup[]
  rangeSlotsLoading: boolean
  selectedSlot?: string
  selectedSlotKey?: string
  onSelect: () => void
  onToggle: () => void
  onSelectSlot: (slot: string, date?: string) => void
}) {
  return (
    <div
      className={`rounded-2xl border bg-white transition ${expanded ? "border-primary shadow-card" : selected ? "border-blue-200" : "border-hairline hover:border-slate-300"} ${aiMatch ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
    >
      <div className="flex items-center gap-3 p-4">
        <Initials name={doctor.profile.fullName} size={48} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-ink">
            BS. {doctor.profile.fullName}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted">
            Chuyên khoa {doctor.specialty ?? "Da liễu"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!selected) onSelect()
            else onToggle()
          }}
          className={`inline-flex h-10 items-center gap-1 rounded-xl border px-5 text-xs font-bold transition ${expanded || selected ? "border-primary bg-white text-primary" : "border-blue-200 bg-white text-primary hover:bg-blue-50"}`}
        >
          {expanded ? "Đóng" : "Chọn"}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-hairline bg-surface-soft px-4 pb-4 pt-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">
            Giờ khám -{" "}
            <span className="text-ink">{rangeMode ? "Khoảng ngày đã chọn" : dateLabel}</span>
          </div>
          {rangeMode ? (
            <RangeSlotGrid
              complete={rangeComplete}
              groups={rangeSlots}
              loading={rangeSlotsLoading}
              selectedSlotKey={selectedSlotKey}
              onSelectSlot={onSelectSlot}
            />
          ) : (
            <SlotGrid
              slots={slots}
              loading={slotsLoading}
              selectedSlot={selectedSlot}
              onSelectSlot={onSelectSlot}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function ServiceRow({
  service,
  selected,
  slots,
  slotsLoading,
  selectedSlot,
  selectedSlotKey,
  dateLabel,
  rangeMode,
  rangeComplete,
  rangeSlots,
  rangeSlotsLoading,
  onSelect,
  onSelectSlot,
}: {
  service: Service
  selected: boolean
  slots?: SlotItem[]
  slotsLoading: boolean
  selectedSlot?: string
  selectedSlotKey?: string
  dateLabel: string
  rangeMode: boolean
  rangeComplete: boolean
  rangeSlots?: SlotGroup[]
  rangeSlotsLoading: boolean
  onSelect: () => void
  onSelectSlot: (slot: string, date?: string) => void
}) {
  return (
    <div
      className={`rounded-2xl border bg-white transition ${selected ? "border-primary shadow-card" : "border-hairline hover:border-slate-300"}`}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-black text-primary">
          {service.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-ink">{service.name}</div>
          <div className="mt-0.5 truncate text-xs text-muted">
            {formatVND(service.price)} - {service.durationMinutes} phút
          </div>
        </div>
        <button
          type="button"
          onClick={onSelect}
          className={`h-10 rounded-xl border px-5 text-xs font-bold transition ${selected ? "border-primary bg-white text-primary" : "border-blue-200 bg-white text-primary hover:bg-blue-50"}`}
        >
          Chọn
        </button>
      </div>
      {selected && (
        <div className="border-t border-hairline bg-surface-soft px-4 pb-4 pt-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">
            Giờ khám - <span className="text-ink">{dateLabel}</span>
          </div>
          {rangeMode ? (
            <RangeSlotGrid
              complete={rangeComplete}
              groups={rangeSlots}
              loading={rangeSlotsLoading}
              selectedSlotKey={selectedSlotKey}
              onSelectSlot={onSelectSlot}
            />
          ) : (
            <SlotGrid
              slots={slots}
              loading={slotsLoading}
              selectedSlot={selectedSlot}
              onSelectSlot={onSelectSlot}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-hairline bg-white p-4 sm:p-5">{children}</section>
  )
}

export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted ${className}`}
    >
      {children}
    </div>
  )
}

export function RadioButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-xs font-bold transition ${active ? "border-primary bg-primary text-white shadow-card" : "border-hairline bg-white text-body hover:border-primary hover:text-primary"}`}
    >
      {icon}
      {label}
    </button>
  )
}

export function Divider() {
  return <div className="h-px bg-hairline" />
}

export function SummaryItem({
  label,
  primary,
  secondary,
}: {
  label: string
  primary: string
  secondary?: string
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">{label}</div>
      <div className="mt-1 text-sm font-bold leading-snug text-ink">{primary}</div>
      {secondary && <div className="mt-0.5 text-[11px] text-muted">{secondary}</div>}
    </div>
  )
}
