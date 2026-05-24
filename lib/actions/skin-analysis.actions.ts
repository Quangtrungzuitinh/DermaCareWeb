'use server'

import { getRecommendedDoctors } from '@/lib/actions/recommendation.actions'
import { getSkinConfidenceThreshold, querySkinDiseaseModel } from '@/lib/hf-skin-model'

const TOP_N = 3

const HIGH_ALERT_CONDITIONS = new Set([
  'Melanoma',
  'Basal Cell Carcinoma',
  'squamous cell carcinoma',
  'Mycosis Fungoides',
  'Lupus Erythematosus Chronicus Discoides',
])

export type AiPrediction = { label: string; score: number; alert?: boolean }

type AnalysisResult = {
  doctorIds: string[]
  _condition: string | null
  _confidence: number | null
}

async function getFallbackDoctorIds(): Promise<string[]> {
  const doctors = await getRecommendedDoctors()
  return doctors.map((d) => d.id)
}

export async function analyzeSkinAndMatchDoctor(imageBase64: string): Promise<AnalysisResult> {
  const fallback: AnalysisResult = {
    doctorIds: await getFallbackDoctorIds(),
    _condition: null,
    _confidence: null,
  }

  if (!imageBase64 || imageBase64.length > 700_000) return fallback

  try {
    const predictions = await querySkinDiseaseModel(imageBase64)
    if (!Array.isArray(predictions) || predictions.length === 0) return fallback

    const top = predictions[0]
    if (!top) return fallback
    const threshold = getSkinConfidenceThreshold()
    if (top.score < threshold) return fallback

    const topPredictions: AiPrediction[] = predictions
      .filter((p) => p.score >= threshold)
      .slice(0, TOP_N)
      .map((p) => ({ label: p.label, score: p.score, alert: HIGH_ALERT_CONDITIONS.has(p.label) }))

    const conditionJson = JSON.stringify(topPredictions)
    const recommendedDoctors = await getRecommendedDoctors(conditionJson)

    return {
      doctorIds: recommendedDoctors.map((d) => d.id),
      _condition: conditionJson,
      _confidence: top.score,
    }
  } catch {
    return fallback
  }
}
