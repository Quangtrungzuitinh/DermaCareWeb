import "server-only"

import { addDays } from "date-fns"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import { getAvailableSlots } from "@/lib/actions/slot.actions"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { formatSlotLabel } from "@/lib/utils"

const dayLabels = {
  MON: "Thứ Hai",
  TUE: "Thứ Ba",
  WED: "Thứ Tư",
  THU: "Thứ Năm",
  FRI: "Thứ Sáu",
  SAT: "Thứ Bảy",
  SUN: "Chủ Nhật",
} as const

type DayKey = keyof typeof dayLabels

export type RecommendationScore = {
  serviceId: string
  serviceName: string
  servicePrice: number
  serviceDurationMinutes: number
  doctorId: string
  doctorName: string
  doctorSpecialty: string | null
  score: number
  nextSlots: string[]
  breakdown: {
    symptomMatch: number
    serviceMatch: number
    doctorSpecialty: number
    availability: number
  }
}

const symptomKeywordGroups = [
  {
    category: "acne",
    keywords: ["mụn", "mụn viêm", "mụn ẩn", "mụn đầu đen", "da dầu", "acne"],
    serviceHints: ["mụn", "acne", "da liễu", "skin consultation"],
    doctorHints: ["da liễu", "dermatology", "mụn"],
  },
  {
    category: "pigmentation",
    keywords: ["nám", "tàn nhang", "thâm", "sạm", "pigmentation", "melasma"],
    serviceHints: ["nám", "tàn nhang", "laser", "peel", "chemical"],
    doctorHints: ["da liễu", "thẩm mỹ", "laser"],
  },
  {
    category: "scar",
    keywords: ["sẹo", "sẹo rỗ", "scar"],
    serviceHints: ["sẹo", "scar", "laser"],
    doctorHints: ["da liễu", "thẩm mỹ", "laser"],
  },
  {
    category: "aging",
    keywords: ["lão hóa", "nhăn", "chảy xệ", "trẻ hóa", "aging", "wrinkle"],
    serviceHints: ["trẻ hóa", "filler", "botox", "laser", "rf"],
    doctorHints: ["thẩm mỹ", "da liễu"],
  },
  {
    category: "hair",
    keywords: ["rụng tóc", "tóc thưa", "hói", "hair loss"],
    serviceHints: ["hair", "tóc", "prp"],
    doctorHints: ["da liễu", "tóc"],
  },
  {
    category: "general",
    keywords: ["ngứa", "đỏ", "dị ứng", "viêm da", "khám tổng quát", "không biết chọn"],
    serviceHints: ["khám", "tổng quát", "consultation", "da liễu"],
    doctorHints: ["da liễu", "dermatology"],
  },
]

function formatSchedule(dayOfWeek: DayKey, startMinute: number, endMinute: number) {
  return `${dayLabels[dayOfWeek]} ${formatSlotLabel(startMinute, endMinute)}`
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFC")
}

function countMatches(text: string, keywords: string[]) {
  const normalized = normalizeText(text)
  return keywords.filter((keyword) => normalized.includes(normalizeText(keyword))).length
}

function scoreTextMatch(text: string, keywords: string[]) {
  if (keywords.length === 0) return 0
  return Math.min(1, countMatches(text, keywords) / Math.min(3, keywords.length))
}

export async function getCurrentChatProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, fullName: true, role: true },
  })
}

function getRecommendationHints(symptoms: string[]) {
  const input = symptoms.join(" ")
  const matched = symptomKeywordGroups.filter((group) => countMatches(input, group.keywords) > 0)
  const groups = matched.length
    ? matched
    : symptomKeywordGroups.filter((group) => group.category === "general")

  return {
    serviceHints: Array.from(
      new Set(groups.flatMap((group) => [...group.keywords, ...group.serviceHints])),
    ),
    doctorHints: Array.from(new Set(groups.flatMap((group) => group.doctorHints))),
  }
}

async function getNextSlotLabels(doctorId: string, targetDate: Date) {
  const labels: string[] = []

  for (let offset = 0; offset < 3 && labels.length < 2; offset += 1) {
    const date = addDays(targetDate, offset)
    const slots = await getAvailableSlots(doctorId, date)
    labels.push(
      ...slots
        .slice(0, 2 - labels.length)
        .map((slot) => formatAppointmentDate(slot, "HH:mm dd/MM/yyyy")),
    )
  }

  return labels
}

export async function scoreRecommendations(
  symptoms: string[],
  targetDate = new Date(),
): Promise<RecommendationScore[]> {
  const cleanSymptoms = symptoms.map((symptom) => symptom.trim()).filter(Boolean)
  if (cleanSymptoms.length === 0) return []

  const { serviceHints, doctorHints } = getRecommendationHints(cleanSymptoms)
  const [services, doctors] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 30,
    }),
    prisma.doctorProfile.findMany({
      where: { isActive: true, approvalStatus: "APPROVED" },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
      take: 30,
    }),
  ])

  const activeDoctors = doctors.filter((doctor) => doctor.profile)
  const matchedDoctors = activeDoctors.filter(
    (doctor) =>
      scoreTextMatch(`${doctor.specialty ?? ""} ${doctor.seniorityLevel}`, doctorHints) > 0,
  )
  const candidateDoctors = matchedDoctors.length ? matchedDoctors : activeDoctors
  const candidates: Array<{
    service: (typeof services)[number]
    doctor: (typeof candidateDoctors)[number]
    symptomMatch: number
    serviceMatch: number
    doctorSpecialty: number
    baseScore: number
  }> = []

  for (const service of services) {
    const serviceText = `${service.name} ${service.description ?? ""}`
    const symptomMatch = scoreTextMatch(serviceText, cleanSymptoms)
    const serviceMatch = scoreTextMatch(serviceText, serviceHints)

    for (const doctor of candidateDoctors) {
      const doctorText = `${doctor.specialty ?? ""} ${doctor.seniorityLevel}`
      const doctorSpecialty = scoreTextMatch(doctorText, doctorHints)
      const baseScore = symptomMatch * 0.4 + serviceMatch * 0.3 + doctorSpecialty * 0.2

      if (baseScore <= 0.1) continue

      candidates.push({ service, doctor, symptomMatch, serviceMatch, doctorSpecialty, baseScore })
    }
  }

  const scored: RecommendationScore[] = []
  const topCandidates = candidates.sort((a, b) => b.baseScore - a.baseScore).slice(0, 8)

  for (const candidate of topCandidates) {
    const nextSlots = await getNextSlotLabels(candidate.doctor.id, targetDate)
    const availability = nextSlots.length > 0 ? 1 : 0
    const score = candidate.baseScore + availability * 0.1

    scored.push({
      serviceId: candidate.service.id,
      serviceName: candidate.service.name,
      servicePrice: candidate.service.price,
      serviceDurationMinutes: candidate.service.durationMinutes,
      doctorId: candidate.doctor.id,
      doctorName: candidate.doctor.profile ? `BS. ${candidate.doctor.profile.fullName}` : "Bác sĩ",
      doctorSpecialty: candidate.doctor.specialty,
      score: Number(score.toFixed(3)),
      nextSlots,
      breakdown: {
        symptomMatch: Number(candidate.symptomMatch.toFixed(2)),
        serviceMatch: Number(candidate.serviceMatch.toFixed(2)),
        doctorSpecialty: Number(candidate.doctorSpecialty.toFixed(2)),
        availability,
      },
    })
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 3)
}

export function formatRecommendationContext(recommendations: RecommendationScore[]) {
  if (recommendations.length === 0) {
    return "Không tìm thấy gợi ý dịch vụ/bác sĩ phù hợp từ dữ liệu hiện có."
  }

  return recommendations
    .map((item, index) => {
      const slots = item.nextSlots.length
        ? item.nextSlots.join(", ")
        : "Chưa có slot trống trong 3 ngày tới"
      return `${index + 1}. ${item.serviceName} (${formatVND(item.servicePrice)}, ${item.serviceDurationMinutes} phút)
   Bác sĩ: ${item.doctorName}${item.doctorSpecialty ? ` - ${item.doctorSpecialty}` : ""}
   Slot gần nhất: ${slots}
   Score: ${item.score}; breakdown: symptom=${item.breakdown.symptomMatch}, service=${item.breakdown.serviceMatch}, doctor=${item.breakdown.doctorSpecialty}, availability=${item.breakdown.availability}`
    })
    .join("\n")
}

export async function buildClinicChatContext() {
  const [faqs, services, doctors, schedules] = await Promise.all([
    prisma.clinicFaq.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      take: 30,
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 30,
    }),
    prisma.doctorProfile.findMany({
      where: { isActive: true, approvalStatus: "APPROVED" },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
      take: 30,
    }),
    prisma.doctorScheduleRule.findMany({
      where: { isActive: true },
      include: { doctor: { include: { profile: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      take: 200,
    }),
  ])

  const faqContext = faqs.length
    ? faqs
        .map(
          (faq) =>
            `- Q: ${faq.question}\n  A: ${faq.answer}\n  Keywords: ${faq.keywords.join(", ")}`,
        )
        .join("\n")
    : "- Chưa có FAQ tĩnh."

  const serviceContext = services.length
    ? services
        .map((service) => {
          const description = service.description ? ` Mô tả: ${service.description}` : ""
          return `- ${service.name}: ${formatVND(service.price)}, ${service.durationMinutes} phút.${description}`
        })
        .join("\n")
    : "- Chưa có dịch vụ đang hoạt động."

  const doctorContext = doctors.length
    ? doctors
        .filter((doctor) => doctor.profile)
        .map((doctor) => {
          const specialty = doctor.specialty ? `, chuyên khoa ${doctor.specialty}` : ""
          return `- BS. ${doctor.profile?.fullName}${specialty}, cấp độ ${doctor.seniorityLevel}.`
        })
        .join("\n")
    : "- Chưa có bác sĩ đang hoạt động và đã duyệt."

  const scheduleContext = schedules.length
    ? schedules
        .filter((schedule) => schedule.doctor.profile)
        .map(
          (schedule) =>
            `- BS. ${schedule.doctor.profile?.fullName}: ${formatSchedule(
              schedule.dayOfWeek,
              schedule.startMinute,
              schedule.endMinute,
            )}, tối đa ${schedule.maxPatients} bệnh nhân.`,
        )
        .join("\n")
    : "- Chưa có lịch làm việc đang hoạt động."

  return [
    "FAQ:",
    faqContext,
    "",
    "Dịch vụ:",
    serviceContext,
    "",
    "Bác sĩ:",
    doctorContext,
    "",
    "Lịch làm việc:",
    scheduleContext,
  ].join("\n")
}

export async function buildGuestClinicContext() {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  type PublicDoctorRow = {
    id: string
    fullName: string
    specialty: string | null
    seniorityLevel: string
  }

  const [faqs, services, doctors] = await Promise.all([
    prisma.clinicFaq.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      take: 12,
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            treatments: {
              where: { createdAt: { gte: since } },
            },
          },
        },
      },
      take: 12,
    }),
    prisma.$queryRaw<PublicDoctorRow[]>`
      SELECT d.id,
             p."fullName" AS "fullName",
             d.specialty,
             d."seniorityLevel"::text AS "seniorityLevel"
      FROM doctor_profiles d
      JOIN profiles p ON p.id = d."profileId"
      WHERE d."isActive" = true
        AND d."approvalStatus"::text = 'APPROVED'
      ORDER BY CASE d."seniorityLevel"::text
        WHEN 'CONSULTANT' THEN 3
        WHEN 'SPECIALIST' THEN 2
        WHEN 'SENIOR' THEN 1
        ELSE 0
      END DESC,
      p."fullName" ASC
      LIMIT 5
    `,
  ])

  const highlightedServices = services
    .sort((a, b) => b._count.treatments - a._count.treatments || a.name.localeCompare(b.name))
    .slice(0, 5)

  const faqContext = faqs.length
    ? faqs.map((faq) => `- Q: ${faq.question}\n  A: ${faq.answer}`).join("\n")
    : "- Chưa có FAQ tĩnh."

  const serviceContext = highlightedServices.length
    ? highlightedServices
        .map((service) => {
          const description = service.description ? ` Mô tả: ${service.description}` : ""
          return `- ${service.name}: ${formatVND(service.price)}, ${service.durationMinutes} phút.${description}`
        })
        .join("\n")
    : "- Chưa có dịch vụ nổi bật đang hoạt động."

  const doctorContext = doctors.length
    ? doctors
        .map((doctor) => {
          const specialty = doctor.specialty ? `, chuyên khoa ${doctor.specialty}` : ""
          return `- BS. ${doctor.fullName}${specialty}, cấp độ ${doctor.seniorityLevel}.`
        })
        .join("\n")
    : "- Chưa có bác sĩ nổi bật đang hoạt động và đã duyệt."

  return [
    "PUBLIC_FAQ:",
    faqContext,
    "",
    "Dịch vụ nổi bật:",
    serviceContext,
    "",
    "Bác sĩ nổi bật:",
    doctorContext,
  ].join("\n")
}
