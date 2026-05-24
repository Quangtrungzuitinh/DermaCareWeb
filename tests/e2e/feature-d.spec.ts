/**
 * Feature D — AI Skin Upload + Doctor Pre-Screening
 * Feature G — Rule-Based Doctor Recommendation
 *
 * Each test runs under all three role projects, but assertions are role-aware:
 *   - Patient project: verify privacy (no disease labels, no scores)
 *   - Doctor project: verify AI panel renders without crash
 *   - Staff project: verify no AI internals exposed
 */

import { test, expect } from "@playwright/test"
import { assertNoAiLeakInPage, ROUTES, FORBIDDEN_IN_PATIENT_UI } from "./helpers"

// ─── D1: Upload widget on booking/select ─────────────────────────────────────

test.describe("D1 – booking/select: AI upload widget", () => {
  test("upload area renders with placeholder text", async ({ page }) => {
    await page.goto(ROUTES.bookingSelect)
    await page.waitForLoadState("domcontentloaded")

    const uploadArea = page.getByText("Chụp hoặc tải ảnh da để AI gợi ý bác sĩ phù hợp")
    await expect(uploadArea).toBeVisible({ timeout: 10_000 })
  })

  test("file input for skin image exists", async ({ page }) => {
    await page.goto(ROUTES.bookingSelect)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator('input[type="file"]')).toHaveCount(1)
  })

  test("no forbidden AI strings visible on page load", async ({ page }) => {
    await page.goto(ROUTES.bookingSelect)
    await page.waitForLoadState("domcontentloaded")

    await assertNoAiLeakInPage(page)
  })
})

// ─── D2: sessionStorage[ai_skin] privacy ─────────────────────────────────────

test.describe("D2 – booking/confirm: no AI disease labels", () => {
  test("confirm page does not expose AI disease labels", async ({ page }) => {
    await page.goto(ROUTES.bookingConfirm)
    await page.waitForLoadState("domcontentloaded")

    await assertNoAiLeakInPage(page)
  })

  test("planting ai_skin in sessionStorage does not cause disease label to render", async ({
    page,
  }) => {
    await page.goto(ROUTES.bookingSelect)
    await page.waitForLoadState("domcontentloaded")

    await page.evaluate(() => {
      sessionStorage.setItem(
        "ai_skin",
        JSON.stringify({ condition: "Melanoma", confidence: 0.9 }),
      )
    })

    await page.goto(ROUTES.bookingConfirm)
    await page.waitForLoadState("domcontentloaded")

    await assertNoAiLeakInPage(page)
  })
})

// ─── D3: Doctor appointment page loads without crash ─────────────────────────

test.describe("D3 – doctor pages load without error", () => {
  test("doctor/appointments loads", async ({ page }) => {
    await page.goto(ROUTES.doctorAppointments)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
    await expect(page.locator("body")).not.toContainText("Internal Server Error")
  })

  test("doctor/medical-records loads", async ({ page }) => {
    await page.goto(ROUTES.doctorMedicalRecords)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
  })
})

// ─── D3 privacy: patient appointment pages have no AI leak ───────────────────

test.describe("D3 – patient/appointments: AI fields not exposed", () => {
  test("patient/appointments has no AI field leak", async ({ page }) => {
    await page.goto(ROUTES.patientAppointments)
    await page.waitForLoadState("domcontentloaded")

    await assertNoAiLeakInPage(page)
  })
})

// ─── G1: Doctor recommendation section ───────────────────────────────────────

test.describe("G1 – booking/select: doctor list renders", () => {
  test("page loads doctor list without crash", async ({ page }) => {
    await page.goto(ROUTES.bookingSelect)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
  })
})

// ─── G2: No scoring internals in booking UI ──────────────────────────────────

test.describe("G2 – booking/select: no scoring internals", () => {
  for (const keyword of [
    "specialty_match_score",
    "seniority_score",
    "availability_score",
    "aiPredictedCondition",
    "aiConfidenceScore",
  ]) {
    test(`does not contain "${keyword}"`, async ({ page }) => {
      await page.goto(ROUTES.bookingSelect)
      await page.waitForLoadState("domcontentloaded")

      const bodyText = await page.locator("body").innerText()
      expect(bodyText).not.toContain(keyword)
    })
  }
})

// ─── D+G cross-route privacy sweep ───────────────────────────────────────────

test.describe("D+G – forbidden AI labels absent from patient-facing routes", () => {
  const routes = [
    ROUTES.bookingSelect,
    ROUTES.bookingConfirm,
    ROUTES.patientAppointments,
    ROUTES.patientHealthRecords,
  ]

  for (const route of routes) {
    test(`${route} — no forbidden AI labels`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState("domcontentloaded")

      await assertNoAiLeakInPage(page)
    })
  }
})
