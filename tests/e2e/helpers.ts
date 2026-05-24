import { type Page, expect } from "@playwright/test"

export type Role = "patient" | "doctor" | "staff"

export const ROUTES = {
  login: "/auth/login",
  bookingSelect: "/booking/select",
  bookingConfirm: "/booking/confirm",
  patientAppointments: "/patient/appointments",
  patientHealthRecords: "/patient/health-records",
  patientDashboard: "/patient/dashboard",
  patientTimeline: "/patient/dashboard/timeline",
  patientWaitlist: "/patient/waitlist",
  doctorAppointments: "/doctor/appointments",
  doctorMedicalRecords: "/doctor/medical-records",
  staffAppointments: "/staff/appointments",
} as const

/** Strings that must NEVER appear anywhere in patient-facing pages */
export const FORBIDDEN_IN_PATIENT_UI = [
  "aiPredictedCondition",
  "aiConfidenceScore",
  "specialty_match_score",
  "seniority_score",
  "availability_score",
  "Melanoma",
  "Tinea Nigra",
  "Psoriasis",
  "Herpes Simplex",
  '"alert"',
  '"score"',
]

export function skipIfNoCredentials(role: Role): string | null {
  const map: Record<Role, string | undefined> = {
    patient: process.env.E2E_PATIENT_EMAIL,
    doctor: process.env.E2E_DOCTOR_EMAIL,
    staff: process.env.E2E_STAFF_EMAIL,
  }
  if (!map[role]) {
    return `E2E_${role.toUpperCase()}_EMAIL not set — skipping`
  }
  return null
}

/**
 * Navigate to a role-appropriate landing page.
 * The browser context already has a valid session via storageState from global-setup —
 * no login form interaction needed.
 */
export async function goToDashboard(page: Page, role: Role) {
  const landing: Record<Role, string> = {
    patient: ROUTES.patientDashboard,
    doctor: ROUTES.doctorAppointments,
    staff: ROUTES.staffAppointments,
  }
  await page.goto(landing[role])
  await page.waitForLoadState("domcontentloaded")
  // If redirected back to login, the session is stale — fail loudly
  const url = page.url()
  if (url.includes("/auth/login")) {
    throw new Error(`${role} session expired or not loaded — re-run to regenerate .auth files`)
  }
}

/** Assert page body text/source does not contain any of the privacy-forbidden strings */
export async function assertNoAiLeakInPage(page: Page) {
  const bodyText = await page.locator("body").innerText()
  const htmlSource = await page.content()

  for (const forbidden of FORBIDDEN_IN_PATIENT_UI) {
    expect(bodyText, `Patient page should not display "${forbidden}"`).not.toContain(forbidden)
    if (forbidden.startsWith('"')) {
      expect(htmlSource, `Page HTML should not contain ${forbidden}`).not.toContain(forbidden)
    }
  }
}
