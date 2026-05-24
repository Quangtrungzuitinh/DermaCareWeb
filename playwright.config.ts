import { defineConfig, devices } from "@playwright/test"
import { config } from "dotenv"

config({ path: ".env.local" })

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      // Patient: booking flow, privacy sweep, health records (patient-facing)
      name: "patient",
      use: { ...devices["Desktop Chrome"], storageState: ".auth/patient.json" },
      testMatch: ["**/feature-d.spec.ts", "**/feature-5.spec.ts", "**/privacy.spec.ts"],
    },
    {
      // Doctor: medical records, treatment plan, AI panel
      name: "doctor",
      use: { ...devices["Desktop Chrome"], storageState: ".auth/doctor.json" },
      testMatch: ["**/medical-records.spec.ts", "**/feature-6a.spec.ts"],
    },
    {
      // Staff: appointments management, waitlist notify, session increment
      name: "staff",
      use: { ...devices["Desktop Chrome"], storageState: ".auth/staff.json" },
      testMatch: ["**/feature-5.spec.ts", "**/feature-6a.spec.ts"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
