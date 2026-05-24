/**
 * Privacy regression suite — cross-cutting AI data leak checks
 *
 * Runs under all three role projects. Patient-project runs are the critical ones;
 * doctor/staff runs verify their pages load without crashing.
 */

import { test, expect } from "@playwright/test"
import { assertNoAiLeakInPage, ROUTES, FORBIDDEN_IN_PATIENT_UI } from "./helpers"

const PATIENT_ROUTES = [
  { name: "booking/select", path: ROUTES.bookingSelect },
  { name: "booking/confirm", path: ROUTES.bookingConfirm },
  { name: "patient/appointments", path: ROUTES.patientAppointments },
  { name: "patient/health-records", path: ROUTES.patientHealthRecords },
  { name: "patient/waitlist", path: ROUTES.patientWaitlist },
  { name: "patient/dashboard/timeline", path: ROUTES.patientTimeline },
]

// ─── Systematic route × forbidden-string sweep ───────────────────────────────

test.describe("Privacy: patient-facing routes must not leak AI internals", () => {
  for (const { name, path } of PATIENT_ROUTES) {
    test(`${name} — no forbidden AI fields`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState("domcontentloaded")

      await assertNoAiLeakInPage(page)
    })
  }
})

// ─── Disease label checks on health records ───────────────────────────────────

test.describe("Privacy: disease labels not visible in health records", () => {
  const diseaseLabels = [
    "Melanoma",
    "Tinea Nigra",
    "Psoriasis",
    "Herpes Simplex",
    "Carcinoma",
    "Squamous",
  ]

  for (const label of diseaseLabels) {
    test(`health records does not contain "${label}"`, async ({ page }) => {
      await page.goto(ROUTES.patientHealthRecords)
      await page.waitForLoadState("domcontentloaded")

      const bodyText = await page.locator("body").innerText()
      expect(bodyText).not.toContain(label)
    })
  }
})

// ─── Confidence score format ──────────────────────────────────────────────────

test.describe("Privacy: raw confidence scores not shown to patient", () => {
  test("health records page has no raw '0.xx' AI score in HTML source", async ({ page }) => {
    await page.goto(ROUTES.patientHealthRecords)
    await page.waitForLoadState("domcontentloaded")

    const html = await page.content()
    // Only fail if the AI-specific field names co-occur with a score
    const hasAiField =
      html.includes("aiConfidenceScore") ||
      html.includes('"confidence"') ||
      html.includes('"score"')
    expect(hasAiField, "Patient HTML must not contain raw AI score fields").toBe(false)
  })
})

// ─── Doctor pages are allowed to show AI data ─────────────────────────────────

test.describe("Privacy: doctor pages load without crash (AI data allowed)", () => {
  test("doctor/appointments loads", async ({ page }) => {
    await page.goto(ROUTES.doctorAppointments)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
  })

  test("doctor/medical-records loads", async ({ page }) => {
    await page.goto(ROUTES.doctorMedicalRecords)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
  })
})

// ─── Booking flow generic copy only ──────────────────────────────────────────

test.describe("Privacy: booking/select shows generic copy only", () => {
  test("no forbidden AI strings in booking/select text", async ({ page }) => {
    await page.goto(ROUTES.bookingSelect)
    await page.waitForLoadState("domcontentloaded")

    const bodyText = await page.locator("body").innerText()
    for (const forbidden of FORBIDDEN_IN_PATIENT_UI) {
      expect(bodyText, `booking/select must not contain "${forbidden}"`).not.toContain(forbidden)
    }
  })

  test("no raw AI prediction JSON in booking/select HTML", async ({ page }) => {
    await page.goto(ROUTES.bookingSelect)
    await page.waitForLoadState("domcontentloaded")

    const html = await page.content()
    expect(html).not.toMatch(/"label":\s*"[A-Z][a-z].*","score":\s*0\.\d/)
  })
})
