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
  _triage: { level: 'RED' | 'YELLOW' | 'GREEN'; label: string; message: string } | null
}

const RED_LABELS = new Set(['basal cell carcinoma', 'melanoma', 'mycosis fungoides', 'squamous cell carcinoma'])
function buildTriage(predictions: AiPrediction[]) {
  const ranked = [...predictions].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const red = ranked.find((item) => RED_LABELS.has((item.label ?? '').trim().toLowerCase()) && (item.score ?? 0) >= 0.1)
  const active = red ?? ranked[0]
  if (!active?.label) return null
  const level = RED_LABELS.has(active.label.trim().toLowerCase()) && (active.score ?? 0) >= 0.1 ? 'RED' as const : 'GREEN' as const
  return {
    level,
    label: active.label,
    message: level === 'RED'
      ? `🚨 CẢNH BÁO: AI phát hiện dấu hiệu liên quan đến ${active.label}. Hãy khám trực tiếp với bác sĩ da liễu ung thư/phẫu thuật; kết quả này không thay thế chẩn đoán y khoa.`
      : `🟢 AI nhận diện khả năng ${active.label}. Bạn nên đặt lịch với bác sĩ da liễu để được kiểm tra và xác nhận.`
  }
}

async function getFallbackDoctorIds(): Promise<string[]> {
  const doctors = await getRecommendedDoctors()
  return doctors.map((d) => d.id)
}

export async function analyzeSkinAndMatchDoctor(imageBase64: string): Promise<AnalysisResult> {
  const startedAt = Date.now()
  const fallback: AnalysisResult = {
    doctorIds: await getFallbackDoctorIds(),
    _condition: null,
    _confidence: null,
    _triage: null,
  }

  if (!imageBase64 || imageBase64.length > 700_000) {
    console.warn('[skin-ai] analysis skipped', { code: 'INVALID_IMAGE_SIZE' })
    return fallback
  }

  try {
    const predictions = (await querySkinDiseaseModel(imageBase64))
      .filter((prediction) => prediction.label.trim() && Number.isFinite(prediction.score) &&
        prediction.score >= 0 && prediction.score <= 1)
      .sort((a, b) => b.score - a.score)
    if (!Array.isArray(predictions) || predictions.length === 0) {
      console.warn('[skin-ai] analysis skipped', { code: 'EMPTY_PREDICTIONS' })
      return fallback
    }

    const top = predictions[0]
    if (!top) return fallback
    const threshold = getSkinConfidenceThreshold()
    if (top.score < threshold) {
      console.warn('[skin-ai] analysis skipped', { code: 'LOW_CONFIDENCE' })
      return fallback
    }

    const topPredictions: AiPrediction[] = predictions
      .filter((p) => p.score >= threshold)
      .slice(0, TOP_N)
      .map((p) => ({ label: p.label, score: p.score, alert: HIGH_ALERT_CONDITIONS.has(p.label) || RED_LABELS.has(p.label.trim().toLowerCase()) }))

    const conditionJson = JSON.stringify(topPredictions)
    const recommendedDoctors = await getRecommendedDoctors(conditionJson)

    console.info('[skin-ai] analysis completed', {
      durationMs: Date.now() - startedAt,
      doctorCount: recommendedDoctors.length,
    })

    return {
      doctorIds: recommendedDoctors.map((d) => d.id),
      _condition: conditionJson,
      _confidence: top.score,
      _triage: buildTriage(topPredictions),
    }
  } catch (error) {
    // Log only known diagnostic codes; never include images, labels, tokens or raw errors.
    const message = error instanceof Error ? error.message : ''
    const code = /^HF_API_ERROR:\d{3}$/.test(message)
      ? message
      : message === 'HF_API_TOKEN/HF_API_KEY not configured'
        ? 'HF_TOKEN_MISSING'
        : message === 'HF_INVALID_RESPONSE'
          ? 'HF_INVALID_RESPONSE'
          : error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
            ? 'HF_TIMEOUT'
            : 'ANALYSIS_OR_RECOMMENDATION_FAILED'
    console.warn('[skin-ai] analysis failed', { code, durationMs: Date.now() - startedAt })
    return fallback
  }
}
