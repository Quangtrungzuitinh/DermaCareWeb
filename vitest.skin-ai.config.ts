import { config } from "dotenv"
import { defineConfig } from "vitest/config"

config({ path: ".env.local", quiet: true })
config({ path: ".env", quiet: true })

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/skin-ai.test.ts"],
    testTimeout: 15000,
    retry: 0,
  },
})
