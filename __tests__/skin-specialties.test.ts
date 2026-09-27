import { SKIN_MODEL_LABELS } from "@/constants/skin-model-labels"
import { getSkinRoutingGroup, getSkinSpecialtyTier, SKIN_LABEL_SPECIALTY, SKIN_SPECIALTIES } from "@/constants/skin-specialties"

describe("Skin AI specialty routing", () => {
  test("covers all 31 model labels exactly once", () => {
    expect(Object.keys(SKIN_LABEL_SPECIALTY).sort()).toEqual([...SKIN_MODEL_LABELS].sort())
    for (const label of SKIN_MODEL_LABELS) {
      const group = getSkinRoutingGroup(JSON.stringify([{ label, score: 0.8 }]))
      expect(group).toBe(SKIN_LABEL_SPECIALTY[label])
      expect(getSkinSpecialtyTier(SKIN_SPECIALTIES[group!], group)).toBe(2)
    }
  })
  test("routes lymphoma to oncology, fungal infection to infection, and leprosy separately", () => {
    expect(SKIN_LABEL_SPECIALTY["Mycosis Fungoides"]).toBe("oncology")
    expect(SKIN_LABEL_SPECIALTY["Tinea Nigra"]).toBe("infection")
    expect(SKIN_LABEL_SPECIALTY["Leprosy Borderline"]).toBe("leprosy")
  })
  test("uses strongest prediction, not input order or repeated weaker predictions", () => {
    expect(getSkinRoutingGroup(JSON.stringify([
      { label: "Tinea Nigra", score: 0.2 }, { label: "Melanoma", score: 0.8 },
    ]))).toBe("oncology")
  })
  test("normalizes Vietnamese and supports explicit multiple specialties", () => {
    expect(getSkinSpecialtyTier("DA LIEU - VIEM VA MIEN DICH", "inflammatory")).toBe(2)
    expect(getSkinSpecialtyTier("Nội tổng quát; Ung thư da", "oncology")).toBe(2)
    expect(getSkinSpecialtyTier("Da liễu tổn thương và thẩm mỹ", "lesions")).toBe(2)
  })
  test("never treats internal medicine, cosmetic care or the wrong subgroup as a match", () => {
    for (const specialty of [null, "Nội tổng quát", "Da liễu thẩm mỹ", "Không phải Ung thư da", SKIN_SPECIALTIES.infection]) {
      expect(getSkinSpecialtyTier(specialty, "oncology")).toBe(0)
    }
    expect(getSkinSpecialtyTier("Da liễu", "oncology")).toBe(1)
  })
  test("unknown, malformed and invalid scores only allow general dermatology fallback", () => {
    for (const input of [undefined, "invalid", "null", "{}", '[{"label":"Unknown","score":0.9}]', '[{"label":"Melanoma","score":2}]']) {
      expect(getSkinRoutingGroup(input)).toBeNull()
    }
    expect(getSkinSpecialtyTier(SKIN_SPECIALTIES.oncology, null)).toBe(0)
    expect(getSkinSpecialtyTier("Da liễu tổng quát", null)).toBe(1)
  })
})
