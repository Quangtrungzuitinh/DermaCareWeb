import { triageSkinAnalysis, SKIN_TRIAGE_RULES } from "@/lib/skin-triage"
import { vi } from "vitest"

vi.mock("server-only", () => ({}))

const doctors = [
  { name: "Cancer specialist", specialties: ["Surgical Dermatology", "Oncologic Dermatology"], tags: ["Melanoma"], is_telehealth_active: true },
  { name: "General doctor", specialties: ["Medical Dermatology", "General Dermatology"], tags: ["Tinea Corporis"], is_telehealth_active: true },
  { name: "Pediatric doctor", specialties: ["Pediatric Dermatology"], tags: ["Impetigo"], is_telehealth_active: true },
]

describe("skin triage pipeline", () => {
  test("covers all 31 labels", () => expect(Object.keys(SKIN_TRIAGE_RULES)).toHaveLength(31))
  test("red override wins over a higher green prediction and disables telehealth", () => {
    const result = triageSkinAnalysis({ ai_predictions: { "21": 0.9, "12": 0.1 }, user_meta: { age: 40 }, doctors_db: doctors })
    expect(result.ai_analysis.triage_urgency).toBe("RED")
    expect(result.ai_analysis.detected_condition_vi).toBe("U hắc tố")
    expect(result.ai_analysis.telehealth_allowed).toBe(false)
    expect(result.recommended_doctors[0]?.can_consult_online).toBe(false)
  })
  test("uses specialty and condition tag score, and prepends pediatric specialty", () => {
    const result = triageSkinAnalysis({ ai_predictions: { "5": 0.8 }, user_meta: { age: 10 }, doctors_db: doctors })
    expect(result.recommended_doctors[0]).toMatchObject({ name: "Pediatric doctor", match_score: 15 })
    expect(result.alert_message).toContain("Chốc lở")
  })
  test("returns only top three matched doctors", () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ name: `d${i}`, specialties: ["Medical Dermatology"], tags: ["Tinea Corporis"], is_telehealth_active: true }))
    const result = triageSkinAnalysis({ ai_predictions: { "21": 0.8 }, user_meta: {}, doctors_db: many })
    expect(result.recommended_doctors).toHaveLength(3)
    expect(result.recommended_doctors[0]?.match_score).toBe(15)
  })
})
