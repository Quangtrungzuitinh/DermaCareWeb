import { SKIN_MODEL_LABELS } from "./skin-model-labels"

// Booking routing groups, not diagnostic or treatment rules.
export const SKIN_SPECIALTIES = {
  oncology: "Da liễu - U da và tổn thương tiền ung thư",
  infection: "Da liễu - Nhiễm trùng và ký sinh trùng",
  leprosy: "Da liễu - Bệnh phong",
  inflammatory: "Da liễu - Viêm và miễn dịch",
  genetic: "Da liễu - Bệnh di truyền và bóng nước",
  lesions: "Da liễu - Tổn thương da và sắc tố",
} as const

export type SkinSpecialty = keyof typeof SKIN_SPECIALTIES
export const GENERAL_DERMATOLOGY = "Da liễu tổng quát"
export const SKIN_SPECIALTY_OPTIONS = [GENERAL_DERMATOLOGY, ...Object.values(SKIN_SPECIALTIES)]

export const SKIN_LABEL_SPECIALTY: Record<(typeof SKIN_MODEL_LABELS)[number], SkinSpecialty> = {
  "Basal Cell Carcinoma": "oncology",
  "Darier_s Disease": "genetic",
  "Epidermolysis Bullosa Pruriginosa": "genetic",
  "Hailey-Hailey Disease": "genetic",
  "Herpes Simplex": "infection",
  "Impetigo": "infection",
  "Larva Migrans": "infection",
  "Leprosy Borderline": "leprosy",
  "Leprosy Lepromatous": "leprosy",
  "Leprosy Tuberculoid": "leprosy",
  "Lichen Planus": "inflammatory",
  "Lupus Erythematosus Chronicus Discoides": "inflammatory",
  "Melanoma": "oncology",
  "Molluscum Contagiosum": "infection",
  "Mycosis Fungoides": "oncology",
  "Neurofibromatosis": "genetic",
  "Papilomatosis Confluentes And Reticulate": "lesions",
  "Pediculosis Capitis": "infection",
  "Pityriasis Rosea": "inflammatory",
  "Porokeratosis Actinic": "oncology",
  "Psoriasis": "inflammatory",
  "Tinea Corporis": "infection",
  "Tinea Nigra": "infection",
  "Tungiasis": "infection",
  "actinic keratosis": "oncology",
  "dermatofibroma": "lesions",
  "nevus": "lesions",
  "pigmented benign keratosis": "lesions",
  "seborrheic keratosis": "lesions",
  "squamous cell carcinoma": "oncology",
  "vascular lesion": "lesions",
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ").trim()
}

const aliases: Record<SkinSpecialty, string[]> = {
  oncology: ["Da liễu ung thư và phẫu thuật", "Da liễu - U da và tổn thương tiền ung thư", "Ung thư da", "U da", "Dermato-oncology", "Skin oncology"],
  infection: ["Da liễu nhiễm trùng và ký sinh trùng", "Da liễu - Nhiễm trùng và ký sinh trùng", "Nhiễm trùng da", "Nấm và ký sinh trùng da", "Infectious dermatology"],
  leprosy: ["Phong", "Bệnh phong", "Hansen disease", "Leprosy"],
  inflammatory: ["Da liễu viêm và miễn dịch", "Da liễu - Viêm và miễn dịch", "Viêm da và miễn dịch", "Da liễu miễn dịch", "Inflammatory dermatology"],
  genetic: ["Da liễu di truyền và nhi khoa", "Da liễu - Bệnh di truyền và bóng nước", "Bệnh da di truyền", "Bệnh da bóng nước", "Genodermatoses"],
  lesions: ["Da liễu tổn thương và thẩm mỹ", "Da liễu - Tổn thương da và sắc tố", "Tổn thương da và sắc tố", "Skin lesions and pigmentation"],
}

export function getSkinRoutingGroup(conditionJson?: string): SkinSpecialty | null {
  if (!conditionJson) return null
  try {
    const parsed: unknown = JSON.parse(conditionJson)
    if (!Array.isArray(parsed)) return null
    const ranked = parsed.filter((item): item is { label: string; score: number } =>
      !!item && typeof item.label === "string" && typeof item.score === "number" &&
      Number.isFinite(item.score) && item.score >= 0 && item.score <= 1)
      .sort((a, b) => b.score - a.score)
    const top = ranked[0]
    if (!top) return null
    const label = SKIN_MODEL_LABELS.find((name) => normalize(name) === normalize(top.label))
    return label ? SKIN_LABEL_SPECIALTY[label] : null
  } catch { return null }
}

// Tier always takes precedence over seniority/availability. No substring matching.
export function getSkinSpecialtyTier(specialty: string | null, group: SkinSpecialty | null) {
  const parts = (specialty ?? "").split(/[;,/|]/).map(normalize)
  if (group && [SKIN_SPECIALTIES[group], ...aliases[group]].some((name) => parts.includes(normalize(name)))) return 2
  if ([GENERAL_DERMATOLOGY, "Da liễu", "Dermatology", "General dermatology"].some((name) => parts.includes(normalize(name)))) return 1
  return 0
}
