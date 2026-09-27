'use server'

import { addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { prisma } from '@/lib/prisma'
import { getAvailableSlots } from '@/lib/actions/slot.actions'
import type { DoctorLevel } from '@/lib/generated/prisma'
import { getSkinRoutingGroup, getSkinSpecialtyTier } from '@/constants/skin-specialties'

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

function clinicDateAtStartOfDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`)
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
  const group = getSkinRoutingGroup(conditionJsonString)
  const doctors = await prisma.doctorProfile.findMany({
    where: { isActive: true, approvalStatus: 'APPROVED', profile: { role: 'DOCTOR' } },
    select: {
      id: true,
      profileId: true,
      licenseNumber: true,
      seniorityLevel: true,
      specialty: true,
      expertiseTags: true,
      expertiseLabels: {
        select: { modelCode: true, labelEn: true, labelVi: true, aliases: true, riskLevel: true },
      },
      serviceAssignments: {
        where: { isActive: true },
        select: { service: { select: { id: true, name: true, description: true } }, reason: true },
      },
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const scored = await Promise.all(
    doctors.filter((doctor) => getSkinSpecialtyTier(doctor.specialty, group) > 0).map(async (doctor) => {
      const specialtyTier = getSkinSpecialtyTier(doctor.specialty, group)
      let activeLabel = ''
      try {
        const parsed = conditionJsonString ? JSON.parse(conditionJsonString) as Array<{ label?: unknown; score?: unknown }> : []
        activeLabel = String(parsed.sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))[0]?.label ?? '').toLowerCase()
      } catch {
        activeLabel = ''
      }
      const expertiseMatchScore = doctor.expertiseTags.some((tag) => tag.toLowerCase() === activeLabel) ||
        doctor.expertiseLabels.some((label) => [label.labelEn, label.labelVi, ...label.aliases]
          .some((tag) => tag.toLowerCase() === activeLabel)) ? 10 : 0
      const seniorityScore = SENIORITY_SCORE[doctor.seniorityLevel] ?? 10
      const availabilityScore = (await hasAvailableSlotInNextThreeDays(doctor.id)) ? 30 : 0
      return { ...doctor, specialtyTier, score: expertiseMatchScore + seniorityScore + availabilityScore }
    }),
  )

  return scored
    .sort((a, b) => b.specialtyTier - a.specialtyTier || b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, RECOMMENDATION_LIMIT)
}
