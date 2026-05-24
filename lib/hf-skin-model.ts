import "server-only"

export const HF_SKIN_DISEASE_MODEL = "Jayanth2002/dinov2-base-finetuned-SkinDisease"
export const HF_SKIN_DISEASE_MODEL_VERSION = `hf:${HF_SKIN_DISEASE_MODEL}`

const HF_BASE = "https://router.huggingface.co/hf-inference/models"

export type HFSkinPrediction = {
  label: string
  score: number
}

export function getSkinConfidenceThreshold() {
  const raw = process.env.AI_CONFIDENCE_THRESHOLD
  const parsed = raw ? Number(raw) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : 0.1
}

export async function querySkinDiseaseModel(imageBase64: string): Promise<HFSkinPrediction[]> {
  const token = process.env.HF_API_TOKEN || process.env.HF_API_KEY
  if (!token) throw new Error("HF_API_TOKEN/HF_API_KEY not configured")

  const response = await fetch(`${HF_BASE}/${HF_SKIN_DISEASE_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: imageBase64 }),
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) throw new Error(`HF_API_ERROR:${response.status}`)
  const data = (await response.json()) as unknown
  if (!Array.isArray(data)) throw new Error("HF_INVALID_RESPONSE")

  return data.map((item) => {
    const prediction = item as Partial<HFSkinPrediction>
    return {
      label: String(prediction.label ?? ""),
      score: Number(prediction.score ?? 0),
    }
  })
}
