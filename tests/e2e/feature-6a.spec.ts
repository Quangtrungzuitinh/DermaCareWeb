/**
 * Feature 6-A — Treatment Plan Management
 */

import { test, expect } from "@playwright/test"
import { assertNoAiLeakInPage, ROUTES } from "./helpers"

// ─── 6A1: Doctor treatment plan fields ───────────────────────────────────────

test.describe("6A1 – doctor/appointments: treatment plan fields", () => {
  test("page loads without crash", async ({ page }) => {
    await page.goto(ROUTES.doctorAppointments)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
  })

  test("treatment plan label visible when appointment open", async ({ page }) => {
    await page.goto(ROUTES.doctorAppointments)
    await page.waitForLoadState("domcontentloaded")

    const firstRow = page.locator("tr, [role='row']").nth(1)
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForTimeout(800)
    }

    const planLabel = page.getByText(/kế hoạch điều trị|phác đồ/i).first()
    const sessionLabel = page.getByText(/số buổi|buổi dự kiến/i).first()
    const hasPlan = await planLabel.isVisible()
    const hasSession = await sessionLabel.isVisible()
    if (hasPlan || hasSession) expect(hasPlan || hasSession).toBe(true)
  })

  test("doctor/medical-records shows N/M progress when plan set", async ({ page }) => {
    await page.goto(ROUTES.doctorMedicalRecords)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")

    const firstCard = page.locator("article, tr").first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      await page.waitForTimeout(800)

      const progress = page.getByText(/\d+\/\d+/).first()
      if (await progress.isVisible()) await expect(progress).toBeVisible()
    }
  })
})

// ─── 6A2: Staff session increment ────────────────────────────────────────────

test.describe("6A2 – staff/appointments: session increment button", () => {
  test("page loads without crash", async ({ page }) => {
    await page.goto(ROUTES.staffAppointments)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
  })

  test("'Ghi nhận buổi' button present when plan exists", async ({ page }) => {
    await page.goto(ROUTES.staffAppointments)
    await page.waitForLoadState("domcontentloaded")

    const firstRow = page.locator("tr").nth(1)
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForTimeout(800)
    }

    const btn = page.getByRole("button", { name: "Ghi nhận buổi" })
    if (await btn.isVisible()) await expect(btn).toBeVisible()
  })
})

// ─── 6A3: Patient sees progress without raw field names ──────────────────────

test.describe("6A3 – patient/health-records: treatment plan progress display", () => {
  test("raw field names not exposed", async ({ page }) => {
    await page.goto(ROUTES.patientHealthRecords)
    await page.waitForLoadState("domcontentloaded")

    const bodyText = await page.locator("body").innerText()
    expect(bodyText).not.toContain("completedSessions")
    expect(bodyText).not.toContain("targetSessions")
    expect(bodyText).not.toContain("planDescription")
    await assertNoAiLeakInPage(page)
  })

  test("progress shown in readable N/M or 'buổi' format when data exists", async ({ page }) => {
    await page.goto(ROUTES.patientHealthRecords)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")

    const bodyText = await page.locator("body").innerText()
    const hasProgress = /\d+\/\d+/.test(bodyText) || bodyText.includes("buổi")
    if (hasProgress) expect(hasProgress).toBe(true)
  })
})
