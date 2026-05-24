import { buildProgressSummary, toPatientProgressSummary } from "@/services/skin-analysis.service"
import { validateObservationValue } from "@/constants/observations"

describe("Medical records: patient-safe progress projection", () => {
  test("converts internal severity into patient progress score", () => {
    const summary = buildProgressSummary("acne", [
      {
        encounterId: "e1",
        encounterDate: "2026-05-01T00:00:00.000Z",
        skinImageId: "img1",
        score: 80,
        confirmed: true,
        bodyArea: "face",
      },
      {
        encounterId: "e2",
        encounterDate: "2026-05-20T00:00:00.000Z",
        skinImageId: "img2",
        score: 40,
        confirmed: false,
        bodyArea: "face",
      },
    ])

    const patient = toPatientProgressSummary(summary)

    expect(patient?.label).toBe("Đang cải thiện")
    expect(patient?.improvementPct).toBe(50)
    expect(patient?.pendingDoctorReview).toBe(true)
    expect(patient?.chartPoints).toEqual([
      { date: "2026-05-01T00:00:00.000Z", progressScore: 20, confirmed: true },
      { date: "2026-05-20T00:00:00.000Z", progressScore: 60, confirmed: false },
    ])
  })

  test("requires at least two points", () => {
    const summary = buildProgressSummary("acne", [
      {
        encounterId: "e1",
        encounterDate: "2026-05-01T00:00:00.000Z",
        skinImageId: "img1",
        score: 80,
        confirmed: true,
        bodyArea: "face",
      },
    ])

    expect(summary).toBeNull()
    expect(toPatientProgressSummary(summary)).toBeNull()
  })
})

describe("Medical records: observation validation", () => {
  test("accepts configured option values", () => {
    expect(validateObservationValue("acne_severity", "moderate")).toBe("moderate")
  })

  test("rejects option values outside registry", () => {
    expect(() => validateObservationValue("acne_severity", "extreme")).toThrow(
      "INVALID_OBSERVATION_OPTION",
    )
  })

  test("validates score ranges", () => {
    expect(validateObservationValue("redness_score", "7")).toBe("7")
    expect(() => validateObservationValue("redness_score", "11")).toThrow(
      "INVALID_OBSERVATION_RANGE",
    )
  })
})
