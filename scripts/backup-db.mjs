import { config } from "dotenv"
import pg from "pg"
import { mkdir, writeFile } from "node:fs/promises"

config({ path: ".env.local", quiet: true })
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) throw new Error("Missing database connection")
const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000 })
try {
  await client.connect()
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY")
  const result = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
  const snapshot = { createdAt: new Date().toISOString(), tables: {}, columns: [] }
  snapshot.columns = (await client.query("SELECT * FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position")).rows
  for (const { tablename } of result.rows) {
    const quoted = '"' + tablename.replaceAll('"', '""') + '"'
    // JSON is encoded by PostgreSQL to preserve timestamp precision and numeric values.
    const rows = await client.query(`SELECT row_to_json(t)::text AS data FROM public.${quoted} t`)
    snapshot.tables[tablename] = rows.rows.map(({ data }) => JSON.parse(data))
    console.log(`${tablename}: ${rows.rowCount} rows backed up`)
  }
  await client.query("ROLLBACK")
  await mkdir(".local-backups", { recursive: true })
  const file = `.local-backups/pre-upgrade-${Date.now()}.json`
  await writeFile(file, JSON.stringify(snapshot, null, 2))
  console.log(`Local data snapshot saved: ${file}. This is a data snapshot, not a full pg_dump.`)
} catch (error) {
  console.error("Backup failed:", error.code || error.name)
  process.exitCode = 1
} finally {
  await client.end()
}
