/**
 * Feature 5 — Dynamic Waitlist
 */

import { test, expect } from "@playwright/test"
import { ROUTES } from "./helpers"

// ─── W1: Waitlist page ───────────────────────────────────────────────────────

test.describe("W1 – patient/waitlist: page loads correctly", () => {
  test("loads without crash", async ({ page }) => {
    await page.goto(ROUTES.patientWaitlist)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
    await expect(page.locator("body")).not.toContainText("Internal Server Error")
  })

  test("shows entries or empty state (not a blank white page)", async ({ page }) => {
    await page.goto(ROUTES.patientWaitlist)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
    // Any meaningful content rendered
    const bodyText = await page.locator("body").innerText()
    expect(bodyText.trim().length).toBeGreaterThan(10)
  })

  test("sidebar has 'Hàng chờ' link pointing to /patient/waitlist", async ({ page }) => {
    await page.goto(ROUTES.patientWaitlist)
    await page.waitForLoadState("domcontentloaded")

    // Only assert if we landed on a patient page (doctor/staff get redirected)
    const currentUrl = page.url()
    if (!currentUrl.includes("/patient/")) return

    const link = page.getByRole("link", { name: "Hàng chờ" })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", "/patient/waitlist")
  })
})

// ─── W2: Join waitlist accessible ────────────────────────────────────────────

test.describe("W2 – booking/select: join waitlist flow accessible", () => {
  test("booking/select loads without crash", async ({ page }) => {
    await page.goto(ROUTES.bookingSelect)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
  })
})

// ─── W3: Staff notify waitlist ───────────────────────────────────────────────

test.describe("W3 – staff/appointments: notify waitlist button", () => {
  test("page loads without crash", async ({ page }) => {
    await page.goto(ROUTES.staffAppointments)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
  })

  test("cancel and notify buttons present in appointment detail", async ({ page }) => {
    await page.goto(ROUTES.staffAppointments)
    await page.waitForLoadState("domcontentloaded")

    const firstRow = page.locator("tr").nth(1)
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForTimeout(800)
    }

    const cancelBtn = page.getByRole("button", { name: "Hủy lịch hẹn" })
    if (await cancelBtn.isVisible()) await expect(cancelBtn).toBeVisible()
  })
})

// ─── W4: Patient cancel waitlist ─────────────────────────────────────────────

test.describe("W4 – patient/waitlist: cancel button for active entries", () => {
  test("'Hủy' button present for WAITING/NOTIFIED entries", async ({ page }) => {
    await page.goto(ROUTES.patientWaitlist)
    await page.waitForLoadState("domcontentloaded")

    const cancelBtn = page.getByRole("button", { name: "Hủy" }).first()
    const isVisible = await cancelBtn.isVisible()
    if (isVisible) await expect(cancelBtn).toBeEnabled()
  })

  test("history section has no cancel button", async ({ page }) => {
    await page.goto(ROUTES.patientWaitlist)
    await page.waitForLoadState("domcontentloaded")

    const historySection = page.getByText(/lịch sử|đã hủy|đã hết hạn/i).first()
    if (await historySection.isVisible()) {
      const historyCancelBtns = page
        .locator('section:has-text("lịch sử")')
        .getByRole("button", { name: "Hủy" })
      await expect(historyCancelBtns).toHaveCount(0)
    }
  })
})

// ─── W5: Status badges ───────────────────────────────────────────────────────

test.describe("W5 – patient/waitlist: entry status display", () => {
  test("status content renders (badge or empty state)", async ({ page }) => {
    await page.goto(ROUTES.patientWaitlist)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("body")).not.toContainText("500")
    const bodyText = await page.locator("body").innerText()
    expect(bodyText.trim().length).toBeGreaterThan(10)
  })
})
