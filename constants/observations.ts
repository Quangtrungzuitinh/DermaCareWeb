export const DERMATOLOGY_OBSERVATIONS = {
  acne_severity: {
    label: "Mức độ mụn",
    unit: null,
    options: ["mild", "moderate", "severe"],
  },
  lesion_count: {
    label: "Số tổn thương",
    unit: "count",
  },
  redness_score: {
    label: "Điểm đỏ da",
    unit: "score",
    range: [0, 10],
  },
  itching_score: {
    label: "Điểm ngứa",
    unit: "score",
    range: [0, 10],
  },
  pain_score: {
    label: "Điểm đau",
    unit: "score",
    range: [0, 10],
  },
  skin_oiliness: {
    label: "Độ nhờn",
    unit: null,
    options: ["dry", "normal", "oily", "combination"],
  },
} as const

export type DermatologyObservationType = keyof typeof DERMATOLOGY_OBSERVATIONS

export function validateObservationValue(type: DermatologyObservationType, value: string) {
  const config = DERMATOLOGY_OBSERVATIONS[type]
  const trimmed = value.trim()
  if (!trimmed) throw new Error("OBSERVATION_VALUE_REQUIRED")

  if ("options" in config && config.options && !config.options.includes(trimmed as never)) {
    throw new Error("INVALID_OBSERVATION_OPTION")
  }

  if ("range" in config && config.range) {
    const numeric = Number(trimmed)
    const [min, max] = config.range
    if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
      throw new Error("INVALID_OBSERVATION_RANGE")
    }
  }

  return trimmed
}
