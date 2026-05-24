"use client"

import { CalendarDays, CalendarRange, Search, Stethoscope, UserRound } from "lucide-react"
import { CalendarGrid } from "@/components/booking/BookingCalendarGrid"
import {
  Card,
  DoctorRow,
  RadioButton,
  SectionLabel,
  ServiceRow,
} from "@/components/booking/BookingSelectParts"
import {
  availableCount,
  fromISO,
  type PatientSummary,
} from "@/components/booking/BookingSelectUtils"
import { SkinAnalysisUpload } from "@/components/booking/SkinAnalysisUpload"
import type { useBookingSelectState } from "@/components/booking/useBookingSelectState"
import type { SlotItem } from "@/types/booking"

type BookingState = ReturnType<typeof useBookingSelectState>

export function BookingSelectLeftColumn({
  booking,
  patient,
}: {
  booking: BookingState
  patient: PatientSummary
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionLabel>Phương thức</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <RadioButton
            active={booking.method === "doctor"}
            onClick={() => booking.setMethod("doctor")}
            icon={<UserRound className="h-4 w-4" />}
            label="Theo bác sĩ"
          />
          <RadioButton
            active={booking.method === "service"}
            onClick={() => booking.setMethod("service")}
            icon={<Stethoscope className="h-4 w-4" />}
            label="Theo dịch vụ"
          />
        </div>
      </Card>

      <Card>
        <SectionLabel>Người tới khám</SectionLabel>
        <div className="rounded-xl border-2 border-primary bg-blue-50 p-3">
          <div className="truncate text-sm font-bold text-ink">
            {patient?.fullName ?? "Chưa có thông tin"}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-muted">
            {patient ? `${patient.email ?? patient.phone ?? ""} - Thành viên` : "Khách vãng lai"}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel className="mb-0">Ngày tới khám</SectionLabel>
          <button
            type="button"
            onClick={booking.toggleRangeMode}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition ${
              booking.rangeMode
                ? "border-primary bg-primary text-white"
                : "border-blue-200 bg-white text-primary hover:bg-blue-50"
            }`}
          >
            {booking.rangeMode ? (
              <CalendarRange className="h-3.5 w-3.5" />
            ) : (
              <CalendarDays className="h-3.5 w-3.5" />
            )}
            {booking.rangeMode ? "Khoảng ngày" : "Một ngày"}
          </button>
        </div>
        <CalendarGrid
          month={booking.viewMonth}
          today={booking.today}
          selectedISO={booking.selectedDate}
          rangeStartISO={booking.rangeMode ? booking.rangeStart : undefined}
          rangeEndISO={booking.rangeMode ? booking.rangeEnd : undefined}
          onPrev={() =>
            booking.setViewMonth(
              new Date(booking.viewMonth.getFullYear(), booking.viewMonth.getMonth() - 1, 1),
            )
          }
          onNext={() =>
            booking.setViewMonth(
              new Date(booking.viewMonth.getFullYear(), booking.viewMonth.getMonth() + 1, 1),
            )
          }
          onPick={booking.selectDate}
        />
        <DateSelectionStatus booking={booking} />
      </Card>
    </div>
  )
}

export function BookingSelectOptionsPanel({ booking }: { booking: BookingState }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionLabel className="mb-0">
          {booking.method === "doctor" ? "Chọn bác sĩ" : "Chọn dịch vụ"}
        </SectionLabel>
        <span className="text-[11px] text-muted">
          {booking.method === "doctor"
            ? booking.filteredDoctors.length
            : booking.filteredServices.length}{" "}
          kết quả
        </span>
      </div>
      {booking.method === "doctor" && <SkinAnalysisUpload onResult={booking.handleAiResult} />}

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
        <input
          value={booking.search}
          onChange={(event) => booking.setSearch(event.target.value)}
          placeholder={
            booking.method === "doctor"
              ? "Tìm kiếm bác sĩ theo tên hoặc chuyên khoa..."
              : "Tìm kiếm dịch vụ..."
          }
          className="h-11 w-full rounded-xl border border-hairline bg-white pl-10 pr-3 text-sm text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>

      {booking.method === "doctor" ? (
        <DoctorOptions booking={booking} />
      ) : (
        <ServiceOptions booking={booking} />
      )}
    </Card>
  )
}

function DateSelectionStatus({ booking }: { booking: BookingState }) {
  if (booking.rangeMode) {
    return (
      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-center text-xs font-bold text-primary-hover">
        {booking.rangeDisplay}
        {booking.rangeStart && booking.rangeEnd && (
          <span className="ml-2 font-semibold text-muted">
            - {booking.rangeSlots.isLoading ? "Đang tải..." : `${booking.rangeSlotCount} khung giờ`}
          </span>
        )}
      </div>
    )
  }
  if (!booking.selectedDate) return null

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-center text-xs font-bold text-primary-hover">
      {booking.selectedDateDisplay}
      <span className="ml-2 font-semibold text-muted">
        - {availableCount(fromISO(booking.selectedDate))} khung giờ
      </span>
    </div>
  )
}

function DoctorOptions({ booking }: { booking: BookingState }) {
  const hasAi = booking.aiDoctorIds.length > 0
  const matched = hasAi
    ? booking.filteredDoctors.filter((doctor) => booking.aiDoctorIds.includes(doctor.id))
    : []
  const rest = hasAi
    ? booking.filteredDoctors.filter((doctor) => !booking.aiDoctorIds.includes(doctor.id))
    : booking.filteredDoctors

  function renderRow(doctor: (typeof booking.filteredDoctors)[0], aiMatch: boolean) {
    const expanded = booking.expandedId === doctor.id || booking.selectedDoctorId === doctor.id
    return (
      <DoctorRow
        key={doctor.id}
        doctor={doctor}
        expanded={expanded}
        selected={booking.selectedDoctorId === doctor.id}
        aiMatch={aiMatch}
        dateLabel={booking.selectedDateDisplay}
        slots={booking.slotsData as SlotItem[] | undefined}
        slotsLoading={booking.slotsLoading && booking.selectedDoctorId === doctor.id}
        rangeMode={booking.rangeMode}
        rangeComplete={booking.rangeDates.length > 0}
        rangeSlots={booking.rangeSlots.data}
        rangeSlotsLoading={booking.rangeSlots.isLoading}
        selectedSlot={booking.selectedSlot}
        selectedSlotKey={booking.selectedSlotKey}
        onSelect={() => booking.selectDoctor(doctor.id)}
        onToggle={() => booking.setExpandedId(expanded ? undefined : doctor.id)}
        onSelectSlot={booking.selectSlot}
      />
    )
  }

  if (!hasAi) {
    return <div className="space-y-2.5">{rest.map((doctor) => renderRow(doctor, false))}</div>
  }

  return (
    <div className="space-y-2.5">
      {matched.length > 0 && (
        <>
          <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-blue-500">
            Được AI gợi ý ({matched.length})
          </p>
          {matched.map((doctor) => renderRow(doctor, true))}
        </>
      )}
      {rest.length > 0 && (
        <>
          <p className="px-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted">
            Bác sĩ khác ({rest.length})
          </p>
          {rest.map((doctor) => renderRow(doctor, false))}
        </>
      )}
    </div>
  )
}

function ServiceOptions({ booking }: { booking: BookingState }) {
  return (
    <div className="space-y-2.5">
      {booking.filteredServices.map((service) => (
        <ServiceRow
          key={service.id}
          service={service}
          selected={booking.selectedServiceId === service.id}
          slots={booking.slotsData as SlotItem[] | undefined}
          slotsLoading={booking.slotsLoading}
          selectedSlot={booking.selectedSlot}
          dateLabel={booking.rangeMode ? booking.rangeDisplay : booking.selectedDateDisplay}
          rangeMode={booking.rangeMode}
          rangeComplete={booking.rangeDates.length > 0}
          rangeSlots={booking.rangeSlots.data}
          rangeSlotsLoading={booking.rangeSlots.isLoading}
          onSelect={() => booking.selectService(service.id)}
          onSelectSlot={booking.selectSlot}
          selectedSlotKey={booking.selectedSlotKey}
        />
      ))}
    </div>
  )
}
