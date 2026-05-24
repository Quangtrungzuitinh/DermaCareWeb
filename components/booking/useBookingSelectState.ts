"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  DAY_FULL,
  eachDayBetween,
  formatDDMMYYYY,
  fromISO,
  toISO,
  toSlotItem,
  type DoctorWithProfile,
  type SlotGroup,
} from "@/components/booking/BookingSelectUtils"
import { useAvailableSlots } from "@/hooks/useAvailableSlots"
import { getAvailableSlots } from "@/lib/actions/slot.actions"
import type { Service } from "@/lib/generated/prisma"

type BookingMethod = "doctor" | "service"

export function useBookingSelectState({
  doctors,
  services,
  selectBasePath,
  confirmBasePath,
}: {
  doctors: DoctorWithProfile[]
  services: Service[]
  selectBasePath: string
  confirmBasePath: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const method = searchParams.get("mode") === "service" ? "service" : "doctor"
  const selectedDoctorId = searchParams.get("doctorId") ?? undefined
  const selectedServiceId = searchParams.get("serviceId") ?? undefined
  const selectedDate = searchParams.get("date") ?? undefined
  const selectedSlot = searchParams.get("slot") ?? undefined
  const selectedSlotKey =
    selectedDate && selectedSlot ? `${selectedDate}|${selectedSlot}` : undefined
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | undefined>(selectedDoctorId)
  const [aiDoctorIds, setAiDoctorIds] = useState<string[]>([])
  const [symptoms, setSymptoms] = useState(searchParams.get("note") ?? "")
  const [rangeMode, setRangeMode] = useState(false)
  const [rangeStart, setRangeStart] = useState<string | undefined>()
  const [rangeEnd, setRangeEnd] = useState<string | undefined>()

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const initialMonth = selectedDate ? fromISO(selectedDate) : today
  const [viewMonth, setViewMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  )

  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId)
  const selectedService = services.find((service) => service.id === selectedServiceId)
  const effectiveDoctorId = selectedDoctorId || (method === "service" ? doctors[0]?.id : undefined)
  const { data: slotsData, isLoading: slotsLoading } = useAvailableSlots(
    effectiveDoctorId ?? null,
    selectedDate ?? null,
  )
  const rangeDates = useMemo(
    () => (rangeMode && rangeStart && rangeEnd ? eachDayBetween(rangeStart, rangeEnd) : []),
    [rangeEnd, rangeMode, rangeStart],
  )
  const rangeSlots = useQuery<SlotGroup[]>({
    queryKey: ["slots-range", effectiveDoctorId, rangeDates],
    queryFn: async () => {
      const groups = await Promise.all(
        rangeDates.map(async (date) => {
          const slots = await getAvailableSlots(effectiveDoctorId!, fromISO(date))
          return {
            date,
            label: `${DAY_FULL[fromISO(date).getDay()]}, ${formatDDMMYYYY(fromISO(date))}`,
            slots: slots.map(toSlotItem),
          }
        }),
      )
      return groups
    },
    enabled: Boolean(effectiveDoctorId && rangeDates.length > 0),
    staleTime: 30_000,
  })
  const rangeSlotCount = rangeSlots.data?.reduce((sum, group) => sum + group.slots.length, 0) ?? 0

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = q
      ? doctors.filter(
          (doctor) =>
            doctor.profile.fullName.toLowerCase().includes(q) ||
            doctor.specialty?.toLowerCase().includes(q),
        )
      : doctors
    if (aiDoctorIds.length > 0) {
      const matched = list.filter((doctor) => aiDoctorIds.includes(doctor.id))
      const rest = list.filter((doctor) => !aiDoctorIds.includes(doctor.id))
      list = [...matched, ...rest]
    }
    return list
  }, [doctors, search, aiDoctorIds])

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return services
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(q) || service.description?.toLowerCase().includes(q),
    )
  }, [search, services])

  const canContinue = Boolean(
    selectedDate && selectedSlot && (selectedDoctorId || selectedServiceId),
  )
  const selectedDateDisplay = selectedDate
    ? `${DAY_FULL[fromISO(selectedDate).getDay()]}, ${formatDDMMYYYY(fromISO(selectedDate))}`
    : "Chưa chọn"
  const rangeDisplay =
    rangeStart && rangeEnd
      ? `${formatDDMMYYYY(fromISO(rangeStart))} - ${formatDDMMYYYY(fromISO(rangeEnd))}`
      : rangeStart
        ? `Bắt đầu ${formatDDMMYYYY(fromISO(rangeStart))} - chọn ngày kết thúc`
        : "Chọn ngày bắt đầu"

  function pushParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    mutator(params)
    router.push(`${selectBasePath}?${params.toString()}`)
  }

  function handleAiResult(ids: string[]) {
    setAiDoctorIds(ids)
    if (ids[0]) setExpandedId(ids[0])
  }

  function setMethod(next: BookingMethod) {
    pushParams((params) => {
      params.set("mode", next)
      params.delete("doctorId")
      params.delete("serviceId")
      params.delete("slot")
    })
    setExpandedId(undefined)
  }

  function selectDoctor(id: string) {
    setExpandedId(id)
    pushParams((params) => {
      params.set("mode", "doctor")
      params.set("doctorId", id)
      params.delete("serviceId")
      params.delete("slot")
    })
  }

  function selectService(id: string) {
    pushParams((params) => {
      params.set("mode", "service")
      params.set("serviceId", id)
      params.delete("slot")
    })
  }

  function selectDate(date: Date) {
    const iso = toISO(date)
    if (rangeMode) {
      let nextStart = rangeStart
      let nextEnd = rangeEnd
      if (!rangeStart || rangeEnd) {
        nextStart = iso
        nextEnd = undefined
      } else if (date < fromISO(rangeStart)) {
        nextStart = iso
        nextEnd = rangeStart
      } else {
        nextEnd = iso
      }
      setRangeStart(nextStart)
      setRangeEnd(nextEnd)
      pushParams((params) => {
        params.delete("date")
        params.delete("slot")
      })
      return
    }
    pushParams((params) => {
      params.set("date", iso)
      params.delete("slot")
    })
  }

  function selectSlot(slot: string, date?: string) {
    if (date) {
      setRangeMode(false)
      setRangeStart(undefined)
      setRangeEnd(undefined)
    }
    pushParams((params) => {
      if (date) params.set("date", date)
      params.set("slot", slot)
    })
  }

  function toggleRangeMode() {
    const next = !rangeMode
    setRangeMode(next)
    if (next) {
      setRangeStart(selectedDate)
      setRangeEnd(undefined)
      pushParams((params) => params.delete("slot"))
    } else {
      setRangeStart(undefined)
      setRangeEnd(undefined)
    }
  }

  function continueConfirm() {
    if (!canContinue) return
    const params = new URLSearchParams()
    params.set("mode", method)
    params.set("doctorId", selectedDoctorId || doctors[0]?.id || "")
    params.set("date", selectedDate!)
    params.set("slot", selectedSlot!)
    if (selectedServiceId) params.set("serviceId", selectedServiceId)
    if (symptoms.trim()) params.set("note", symptoms.trim())
    router.push(`${confirmBasePath}?${params.toString()}`)
  }

  return {
    aiDoctorIds,
    canContinue,
    continueConfirm,
    expandedId,
    filteredDoctors,
    handleAiResult,
    filteredServices,
    method,
    rangeDates,
    rangeDisplay,
    rangeEnd,
    rangeMode,
    rangeSlotCount,
    rangeSlots,
    rangeStart,
    search,
    selectDate,
    selectDoctor,
    selectService,
    selectedDate,
    selectedDateDisplay,
    selectedDoctor,
    selectedDoctorId,
    selectedService,
    selectedServiceId,
    selectedSlot,
    selectedSlotKey,
    selectSlot,
    setExpandedId,
    setMethod,
    setSearch,
    setSymptoms,
    setViewMonth,
    slotsData,
    slotsLoading,
    symptoms,
    today,
    toggleRangeMode,
    viewMonth,
  }
}
