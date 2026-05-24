// prisma.config.ts
import { config } from "dotenv"
import { defineConfig } from "prisma/config"

// Try .env.local first (local override), fall back to .env
// dotenv does NOT overwrite already-set vars, so order matters
config({ path: ".env.local" })
config({ path: ".env" })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer DIRECT_URL for migrations; fall back to DATABASE_URL for local checks.
    url: (process.env.DIRECT_URL ?? process.env.DATABASE_URL) as string,
  },
})
