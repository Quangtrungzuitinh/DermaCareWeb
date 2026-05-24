import "server-only"

import {
  getSkinConfidenceThreshold,
  HF_SKIN_DISEASE_MODEL_VERSION,
  type HFSkinPrediction,
  querySkinDiseaseModel,
} from "@/lib/hf-skin-model"
import { getDriveFileStream } from "@/lib/google-drive"

const TOP_N = 3

export const SKIN_ANALYSIS_MODEL_VERSION = HF_SKIN_DISEASE_MODEL_VERSION

export type SkinAnalysisScores = {
  acneSeverity: number | null
  rednessScore: number | null
  pigmentScore: number | null
  oilinessScore: number | null
  conditionType: string
  confidence: number
  reasoning: string
  modelVersion: string
  rawPredictions: HFSkinPrediction[]
}

function normalizeScore(value: number | null | undefined) {
  if (value === null || value === undefined) return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return Math.max(0, Math.min(100, numeric))
}

function classifyConditionType(label: string) {
  const normalized = label.toLowerCase()

  if (
    normalized.includes("acne") ||
    normalized.includes("comed") ||
    normalized.includes("blackhead") ||
    normalized.includes("whitehead") ||
    normalized.includes("pustule")
  ) {
    return "acne"
  }

  if (
    normalized.includes("melasma") ||
    normalized.includes("pigment") ||
    normalized.includes("tinea nigra") ||
    normalized.includes("dark")
  ) {
    return "melasma"
  }

  if (normalized.includes("rosacea") || normalized.includes("erythema")) {
    return "rosacea"
  }

  if (
    normalized.includes("eczema") ||
    normalized.includes("dermatitis") ||
    normalized.includes("psoriasis") ||
    normalized.includes("lupus")
  ) {
    return "eczema"
  }

  return "other"
}

export function mapDinov2PredictionsToProgressScores(
  predictions: HFSkinPrediction[],
): SkinAnalysisScores {
  const threshold = getSkinConfidenceThreshold()
  const sorted = predictions
    .filter((prediction) => Number.isFinite(prediction.score))
    .sort((a, b) => b.score - a.score)

  const top = sorted[0]
  if (!top || top.score < threshold) throw new Error("HF_LOW_CONFIDENCE")

  const conditionType = classifyConditionType(top.label)
  const severityProxy = normalizeScore(top.score * 100)
  const rawPredictions = sorted.slice(0, TOP_N)

  const isRednessTrack = conditionType === "eczema" || conditionType === "rosacea"

  return {
    acneSeverity: conditionType === "acne" || conditionType === "other" ? severityProxy : null,
    rednessScore: isRednessTrack ? severityProxy : null,
    pigmentScore: conditionType === "melasma" ? severityProxy : null,
    oilinessScore: null,
    conditionType,
    confidence: Math.max(0, Math.min(1, top.score)),
    reasoning:
      "Mapped from the deployed Feature D/G DINOv2 skin classifier; severity is derived from the top prediction score for progress tracking only.",
    modelVersion: SKIN_ANALYSIS_MODEL_VERSION,
    rawPredictions,
  }
}

export async function analyzeSkinImage(params: {
  driveFileId: string
  mimeType: string
  conditionHint?: string | null
}): Promise<SkinAnalysisScores> {
  const stream = await getDriveFileStream(params.driveFileId)
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const base64 = Buffer.concat(chunks).toString("base64")

  const predictions = await querySkinDiseaseModel(base64)
  return mapDinov2PredictionsToProgressScores(predictions)
}
