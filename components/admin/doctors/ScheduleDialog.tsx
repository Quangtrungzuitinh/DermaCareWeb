"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { saveWeeklyRules } from "@/lib/actions/schedule.actions"
import { ScheduleDayCard } from "@/components/admin/doctors/ScheduleDayCard"
import type { UiDoctor, UiScheduleRule } from "@/services/clinic.types"
import type { DayOfWeek } from "@/lib/generated/prisma"

export const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "MON", label: "T2" },
  { value: "TUE", label: "T3" },
  { value: "WED", label: "T4" },
  { value: "THU", label: "T5" },
  { value: "FRI", label: "T6" },
  { value: "SAT", label: "T7" },
  { value: "SUN", label: "CN" },
]

export type DayDraft = {
  enabled: boolean
  start: string
  end: string
  slotDuration: number
  maxPatients: number
}

type ScheduleDraft = Record<DayOfWeek, DayDraft>

export function ScheduleDialog({
  doctor,
  rules,
  onOpenChange,
}: {
  doctor: UiDoctor | null
  rules: UiScheduleRule[]
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [draft, setDraft] = useState<ScheduleDraft>(() => buildDraft(rules))

  useEffect(() => {
    setDraft(buildDraft(rules))
    setError("")
  }, [rules])

  const activeDays = useMemo(() => DAYS.filter((day) => draft[day.value].enabled), [draft])

  const updateDay = (day: DayOfWeek, patch: Partial<DayDraft>) => {
    setDraft((current) => ({
      ...current,
      [day]: { ...current[day], ...patch },
    }))
  }

  const save = () => {
    if (!doctor) return
    setError("")

    const nextRules = activeDays.map(({ value }) => {
      const item = draft[value]
      return {
        dayOfWeek: value,
        startMinute: timeToMinute(item.start),
        endMinute: timeToMinute(item.end),
        slotDuration: item.slotDuration,
        maxPatients: item.maxPatients,
        isActive: true,
      }
    })

    const invalid = nextRules.find((rule) => rule.endMinute <= rule.startMinute)
    if (invalid) {
      setError("Giờ kết thúc phải sau giờ bắt đầu.")
      return
    }

    startTransition(async () => {
      try {
        await saveWeeklyRules(doctor.id, nextRules)
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể lưu lịch làm việc.")
      }
    })
  }

  return (
    <Dialog open={Boolean(doctor)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-hairline-muted p-0 sm:max-w-4xl">
        {doctor && (
          <>
            <div className="border-b border-hairline-muted px-6 py-5">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="pr-8 text-xl font-bold text-ink">Lịch làm việc</DialogTitle>
                <DialogDescription className="text-muted">
                  {doctor.fullName} · {doctor.specialty ?? "Chưa có chuyên khoa"}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-3 md:grid-cols-2">
                {DAYS.map((day) => (
                  <ScheduleDayCard
                    key={day.value}
                    day={day}
                    item={draft[day.value]}
                    onUpdate={updateDay}
                  />
                ))}
              </div>

              {error && (
                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 border-t border-hairline-muted pt-4">
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Đang lưu..." : "Lưu lịch làm việc"}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-10 rounded-full border border-hairline px-5 text-sm font-semibold text-body transition hover:bg-surface-card"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function buildDraft(rules: UiScheduleRule[]): ScheduleDraft {
  const base = Object.fromEntries(
    DAYS.map((day) => [
      day.value,
      {
        enabled: false,
        start: "08:00",
        end: "17:00",
        slotDuration: 30,
        maxPatients: 1,
      },
    ]),
  ) as ScheduleDraft

  for (const rule of rules) {
    base[rule.dayOfWeek] = {
      enabled: rule.isActive,
      start: minuteToTime(rule.startMinute),
      end: minuteToTime(rule.endMinute),
      slotDuration: rule.slotDuration,
      maxPatients: rule.maxPatients,
    }
  }

  return base
}

function minuteToTime(value: number) {
  const hour = Math.floor(value / 60)
  const minute = value % 60
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function timeToMinute(value: string) {
  const [hour = 0, minute = 0] = value.split(":").map(Number)
  return hour * 60 + minute
}
