'use server'

import { addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { getAvailableSlots } from '@/lib/actions/slot.actions'

const CLINIC_TIMEZONE = 'Asia/Ho_Chi_Minh'

export type SmartSlotSuggestion = {
  date: string
  slots: Date[]
}

function clinicDateAtStartOfDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`)
}

export async function suggestNearestSlots(doctorId: string, maxDays = 7): Promise<SmartSlotSuggestion[]> {
  const suggestions: SmartSlotSuggestion[] = []
  const todayKey = formatInTimeZone(new Date(), CLINIC_TIMEZONE, 'yyyy-MM-dd')
  const today = clinicDateAtStartOfDay(todayKey)

  for (let i = 0; i < maxDays; i++) {
    const date = addDays(today, i)
    const dateKey = format(date, 'yyyy-MM-dd')
    const slots = await getAvailableSlots(doctorId, date)

    if (slots.length > 0) {
      suggestions.push({ date: dateKey, slots })
      if (suggestions.length >= 3) break
    }
  }

  return suggestions
}
