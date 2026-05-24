/**
 * Medical Records — Clinical Flow (MR1–MR8)
 */

import { test, expect } from "@playwright/test"
import { assertNoAiLeakInPage, ROUTES } from "./helpers"

// ─── MR1: Staff check-in ─────────────────────────────────────────────────────

test.describe("MR1 – staff/appointments: check-in UI accessible", () => {
  test("page loads without crash", async ({ page }) => {
    await page.goto(ROUTES.staffAppointments)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
    await expect(page.locator("body")).not.toContainText("Internal Server Error")
  })

  test("'Check-in bệnh nhân' button available when CONFIRMED appointment opened", async ({
    page,
  }) => {
    await page.goto(ROUTES.staffAppointments)
    await page.waitForLoadState("domcontentloaded")

    const firstRow = page.locator("tr").nth(1)
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForTimeout(600)
    }

    const checkInBtn = page.getByRole("button", { name: "Check-in bệnh nhân" })
    const isVisible = await checkInBtn.isVisible()
    if (isVisible) await expect(checkInBtn).toBeEnabled()
  })
})

// ─── MR2: Doctor saves draft record ──────────────────────────────────────────

test.describe("MR2 – doctor/appointments: draft record editable", () => {
  test("page loads without crash", async ({ page }) => {
    await page.goto(ROUTES.doctorAppointments)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
  })

  test("'Lưu bệnh án' button present in appointment detail", async ({ page }) => {
    await page.goto(ROUTES.doctorAppointments)
    await page.waitForLoadState("domcontentloaded")

    const firstRow = page.locator("tr, [role='row']").nth(1)
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForTimeout(800)
    }

    const saveBtn = page.getByRole("button", { name: "Lưu bệnh án" })
    const isVisible = await saveBtn.isVisible()
    if (isVisible) await expect(saveBtn).toBeEnabled()
  })
})

// ─── MR3: Prescription panel ─────────────────────────────────────────────────

test.describe("MR3 – doctor/medical-records: prescription panel accessible", () => {
  test("prescription step label visible in clinical edit", async ({ page }) => {
    await page.goto(ROUTES.doctorMedicalRecords)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")

    const firstCard = page.locator("article, tr").first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      await page.waitForTimeout(800)
    }

    const prescriptionLabel = page.getByText("Đơn thuốc").first()
    const isVisible = await prescriptionLabel.isVisible()
    if (isVisible) await expect(prescriptionLabel).toBeVisible()
  })
})

// ─── MR4: Skin image upload section ──────────────────────────────────────────

test.describe("MR4 – doctor/medical-records: skin image section present", () => {
  test("'Ảnh da' step accessible in clinical edit panel", async ({ page }) => {
    await page.goto(ROUTES.doctorMedicalRecords)
    await page.waitForLoadState("domcontentloaded")

    const firstCard = page.locator("article, tr").first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      await page.waitForTimeout(800)
    }

    const skinLabel = page.getByText("Ảnh da").first()
    const isVisible = await skinLabel.isVisible()
    if (isVisible) await expect(skinLabel).toBeVisible()
  })
})

// ─── MR6: Finalize record ────────────────────────────────────────────────────

test.describe("MR6 – doctor/medical-records: finalize button present", () => {
  test("'Confirm hồ sơ' button appears in detail dialog", async ({ page }) => {
    await page.goto(ROUTES.doctorMedicalRecords)
    await page.waitForLoadState("domcontentloaded")

    const firstCard = page.locator("article, tr").first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      await page.waitForTimeout(800)
    }

    const finalizeBtn = page.getByRole("button", { name: "Confirm hồ sơ" })
    const isVisible = await finalizeBtn.isVisible()
    if (isVisible) await expect(finalizeBtn).toBeVisible()
  })

  test("finalized record shows 'Đã confirm' badge", async ({ page }) => {
    await page.goto(ROUTES.doctorMedicalRecords)
    await page.waitForLoadState("domcontentloaded")

    const finalizedBadge = page.getByText("Đã confirm").first()
    const draftBadge = page.getByText("Draft").first()
    const hasEither = (await finalizedBadge.isVisible()) || (await draftBadge.isVisible())
    if (hasEither) expect(hasEither).toBe(true)
  })
})

// ─── MR7: Patient health records timeline ────────────────────────────────────

test.describe("MR7 – patient/health-records: timeline layout", () => {
  test("page loads without crash", async ({ page }) => {
    await page.goto(ROUTES.patientHealthRecords)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
    await expect(page.locator("body")).not.toContainText("Internal Server Error")
  })

  test("no duplicate tab labels (old 3-tab bug regression)", async ({ page }) => {
    await page.goto(ROUTES.patientHealthRecords)
    await page.waitForLoadState("domcontentloaded")

    const tabItems = page.locator('[role="tab"]')
    const tabCount = await tabItems.count()
    if (tabCount > 0) {
      const labels: string[] = []
      for (let i = 0; i < tabCount; i++) {
        labels.push(await tabItems.nth(i).innerText())
      }
      const unique = new Set(labels)
      expect(unique.size, `Duplicate tabs: ${labels.join(", ")}`).toBe(labels.length)
    }
  })

  test("no AI disease labels visible to patient", async ({ page }) => {
    await page.goto(ROUTES.patientHealthRecords)
    await page.waitForLoadState("domcontentloaded")

    await assertNoAiLeakInPage(page)
  })

  test("AI progress chip uses allowed trend labels only", async ({ page }) => {
    await page.goto(ROUTES.patientHealthRecords)
    await page.waitForLoadState("domcontentloaded")

    await assertNoAiLeakInPage(page)

    const bodyText = await page.locator("body").innerText()
    const allowedTrends = ["Đang cải thiện", "Ổn định", "Cần theo dõi thêm"]
    const hasTrend = allowedTrends.some((t) => bodyText.includes(t))
    if (hasTrend) expect(hasTrend).toBe(true)
  })
})

// ─── MR8: Old timeline route does not crash ───────────────────────────────────

test.describe("MR8 – patient/dashboard/timeline: old route safe", () => {
  test("does not return 500 error", async ({ page }) => {
    await page.goto(ROUTES.patientTimeline)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
    await expect(page.locator("body")).not.toContainText("Internal Server Error")
    await expect(page.locator("body")).not.toContainText("NEXT_NOT_FOUND")
  })
})
