'use server'

import { addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { prisma } from '@/lib/prisma'
import { getAvailableSlots } from '@/lib/actions/slot.actions'
import type { DoctorLevel } from '@/lib/generated/prisma'

const CLINIC_TIMEZONE = 'Asia/Ho_Chi_Minh'
const RECOMMENDATION_LIMIT = 5
const AVAILABILITY_DAYS = 3

const SENIORITY_SCORE: Record<DoctorLevel, number> = {
  FRESHER: 10,
  JUNIOR: 20,
  SENIOR: 30,
  SPECIALIST: 40,
  CONSULTANT: 50,
}

type AiPredictionInput = { label?: unknown }

function clinicDateAtStartOfDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`)
}

function extractConditionKeywords(conditionJsonString?: string) {
  if (!conditionJsonString) return []
  try {
    const parsed = JSON.parse(conditionJsonString) as unknown
    if (!Array.isArray(parsed)) return []
    const keywords = parsed
      .flatMap((item) => {
        const p = item as AiPredictionInput
        if (typeof p?.label !== 'string') return []
        const label = p.label.trim().toLowerCase()
        const tokens = label.split(/[^a-z0-9]+/i).filter((t) => t.length > 2)
        return [label, ...tokens]
      })
      .filter(Boolean)
    return Array.from(new Set(keywords))
  } catch {
    return []
  }
}

async function hasAvailableSlotInNextThreeDays(doctorId: string) {
  const todayKey = formatInTimeZone(new Date(), CLINIC_TIMEZONE, 'yyyy-MM-dd')
  const today = clinicDateAtStartOfDay(todayKey)
  for (let day = 0; day < AVAILABILITY_DAYS; day++) {
    const date = addDays(today, day)
    const slots = await getAvailableSlots(doctorId, clinicDateAtStartOfDay(format(date, 'yyyy-MM-dd')))
    if (slots.length > 0) return true
  }
  return false
}

export async function getRecommendedDoctors(conditionJsonString?: string) {
  const conditionKeywords = extractConditionKeywords(conditionJsonString)
  const doctors = await prisma.doctorProfile.findMany({
    where: { isActive: true },
    select: {
      id: true,
      profileId: true,
      licenseNumber: true,
      seniorityLevel: true,
      specialty: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const scored = await Promise.all(
    doctors.map(async (doctor) => {
      const specialty = doctor.specialty?.toLowerCase() ?? ''
      const specialtyMatchScore = conditionKeywords.some((kw) => specialty.includes(kw)) ? 50 : 0
      const seniorityScore = SENIORITY_SCORE[doctor.seniorityLevel] ?? 10
      const availabilityScore = (await hasAvailableSlotInNextThreeDays(doctor.id)) ? 30 : 0
      return { ...doctor, score: specialtyMatchScore + seniorityScore + availabilityScore }
    }),
  )

  return scored
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, RECOMMENDATION_LIMIT)
}
