import { chromium, type FullConfig } from "@playwright/test"
import { config } from "dotenv"
import path from "path"
import fs from "fs"

config({ path: ".env.local" })

const BASE_URL = "http://localhost:3000"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0]
const LS_KEY = `sb-${PROJECT_REF}-auth-token`

async function getSupabaseSession(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ email, password }),
  })
  const data = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_at?: number
    user?: { id: string; email: string; role: string }
    error_description?: string
  }
  if (!data.access_token) throw new Error(`Login failed for ${email}: ${data.error_description}`)
  return data
}

async function saveSession(role: string, email: string, password: string, outFile: string) {
  const session = await getSupabaseSession(email, password)

  // Build the storageState manually: inject the Supabase token into localStorage
  // so the browser client picks it up without going through the login form.
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: BASE_URL,
        localStorage: [
          {
            name: LS_KEY,
            value: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
              token_type: "bearer",
              user: session.user,
            }),
          },
        ],
      },
    ],
  }

  // Also set the cookie that @supabase/ssr uses for server-side auth
  // Playwright needs cookies injected too for SSR middleware to recognize the session.
  // We spin up a real browser, navigate to the app with the localStorage pre-seeded,
  // then capture the full storageState (which now includes the SSR cookie set by the server).
  const browser = await chromium.launch()
  const context = await browser.newContext({ storageState })
  const page = await context.newPage()

  // Navigate to a protected page — the browser will send the localStorage token,
  // Next.js will set the HttpOnly cookie via the SSR route, and we capture everything.
  await page.goto(`${BASE_URL}/patient/dashboard`)
  await page.waitForLoadState("domcontentloaded")

  await context.storageState({ path: outFile })
  await browser.close()
  console.log(`[global-setup] ${role} (${email}) session saved → ${outFile}`)
}

export default async function globalSetup(_config: FullConfig) {
  const patient = { email: process.env.E2E_PATIENT_EMAIL, password: process.env.E2E_PATIENT_PASSWORD }
  const doctor  = { email: process.env.E2E_DOCTOR_EMAIL,  password: process.env.E2E_DOCTOR_PASSWORD  }
  const staff   = { email: process.env.E2E_STAFF_EMAIL,   password: process.env.E2E_STAFF_PASSWORD   }

  if (patient.email && patient.password) {
    await saveSession("patient", patient.email, patient.password, path.resolve(".auth/patient.json"))
  }
  if (doctor.email && doctor.password) {
    await saveSession("doctor", doctor.email, doctor.password, path.resolve(".auth/doctor.json"))
  }
  if (staff.email && staff.password) {
    await saveSession("staff", staff.email, staff.password, path.resolve(".auth/staff.json"))
  }
}
