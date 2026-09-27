import { config } from "dotenv"
import pg from "pg"

config({ path: ".env.local", quiet: true })
config({ path: ".env", quiet: true })
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
  console.error("Missing DIRECT_URL / DATABASE_URL in .env.local. Copy from Supabase > Connect.")
  process.exit(1)
}

const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000 })
try {
  await client.connect()
  await client.query("BEGIN READ ONLY")
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
  )
  console.log("Public tables:", tables.rows.map((row) => row.table_name).join(", "))
  const names = new Set(tables.rows.map((row) => row.table_name))
  if (names.has("_prisma_migrations")) {
    const migrations = await client.query(
      'SELECT migration_name, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back FROM public._prisma_migrations ORDER BY started_at',
    )
    console.table(migrations.rows)
  } else {
    console.log("No Prisma migration history. Review/baseline existing schema before deploying migrations.")
  }
  const extensions = await client.query("SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_cron')")
  console.log("Extensions:", extensions.rows.map((row) => row.extname).join(", "))
  const consent = await client.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name IN ('consentDataStorage', 'consentGivenAt')",
  )
  console.table(consent.rows)
  for (const table of ["profiles", "doctor_profiles", "services", "doctor_schedule_rules", "appointments"]) {
    if (names.has(table)) {
      const result = await client.query(`SELECT count(*) AS count FROM public."${table}"`)
      console.log(`${table}: ${result.rows[0].count} rows`)
    }
  }
  await client.query("ROLLBACK")
} catch (error) {
  console.error("Database inspection failed:", error.code || error.name)
  process.exitCode = 1
} finally {
  await client.end()
}
