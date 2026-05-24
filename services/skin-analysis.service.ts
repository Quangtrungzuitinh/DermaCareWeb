import { prisma } from "@/lib/prisma"

export type ProgressTrend = "IMPROVING" | "WORSENING" | "STABLE"

export type ProgressDataPoint = {
  encounterId: string
  encounterDate: string
  skinImageId: string
  score: number
  confirmed: boolean
  bodyArea: string | null
}

export type ProgressSummary = {
  conditionType: string
  dataPoints: ProgressDataPoint[]
  firstScore: number
  latestScore: number
  improvementPct: number
  trend: ProgressTrend
}

export type PatientProgressSummary = {
  label: "Đang cải thiện" | "Ổn định" | "Cần theo dõi thêm"
  trend: ProgressTrend
  improvementPct: number | null
  visitCount: number
  latestCheckedAt: string
  chartPoints: Array<{
    date: string
    progressScore: number
    confirmed: boolean
  }>
  pendingDoctorReview: boolean
}

export async function getPatientProgress(params: {
  patientId: string
  conditionType?: string
  scoreType?: "acneSeverity" | "rednessScore" | "pigmentScore" | "oilinessScore"
}): Promise<ProgressSummary | null> {
  const scoreType = params.scoreType ?? "acneSeverity"
  const results = await prisma.skinAnalysisResult.findMany({
    where: {
      patientId: params.patientId,
      conditionType: params.conditionType,
      error: null,
    },
    include: {
      skinImage: { select: { capturedAt: true, bodyArea: true, encounterId: true } },
    },
    orderBy: { analyzedAt: "asc" },
  })

  const dataPoints = results
    .filter((result) => result[scoreType] !== null)
    .map((result): ProgressDataPoint => ({
      encounterId: result.encounterId ?? result.skinImage.encounterId ?? "",
      encounterDate: result.skinImage.capturedAt.toISOString(),
      skinImageId: result.skinImageId,
      score: result.doctorOverrideScore ?? (result[scoreType] as number),
      confirmed: result.doctorConfirmed,
      bodyArea: result.skinImage.bodyArea,
    }))

  return buildProgressSummary(results[0]?.conditionType ?? params.conditionType ?? "other", dataPoints)
}

export function buildProgressSummary(
  conditionType: string,
  dataPoints: ProgressDataPoint[],
): ProgressSummary | null {
  if (dataPoints.length < 2) return null

  const firstScore = dataPoints[0]?.score
  const latestScore = dataPoints[dataPoints.length - 1]?.score
  if (firstScore === undefined || latestScore === undefined || firstScore === 0) return null

  const improvementPct = ((firstScore - latestScore) / firstScore) * 100
  const trend: ProgressTrend =
    improvementPct > 5 ? "IMPROVING" : improvementPct < -5 ? "WORSENING" : "STABLE"

  return {
    conditionType,
    dataPoints,
    firstScore,
    latestScore,
    improvementPct: Math.round(improvementPct * 10) / 10,
    trend,
  }
}

export function toPatientProgressSummary(
  summary: ProgressSummary | null,
): PatientProgressSummary | null {
  if (!summary || summary.dataPoints.length < 2) return null

  const chartPoints = summary.dataPoints.map((point) => ({
    date: point.encounterDate,
    progressScore: clampProgressScore(100 - point.score),
    confirmed: point.confirmed,
  }))

  const latest = summary.dataPoints[summary.dataPoints.length - 1]
  if (!latest) return null

  return {
    label: getPatientTrendLabel(summary.trend),
    trend: summary.trend,
    improvementPct: Number.isFinite(summary.improvementPct)
      ? Math.max(0, Math.round(summary.improvementPct * 10) / 10)
      : null,
    visitCount: summary.dataPoints.length,
    latestCheckedAt: latest.encounterDate,
    chartPoints,
    pendingDoctorReview: summary.dataPoints.some((point) => !point.confirmed),
  }
}

function getPatientTrendLabel(trend: ProgressTrend): PatientProgressSummary["label"] {
  if (trend === "IMPROVING") return "Đang cải thiện"
  if (trend === "WORSENING") return "Cần theo dõi thêm"
  return "Ổn định"
}

function clampProgressScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}
