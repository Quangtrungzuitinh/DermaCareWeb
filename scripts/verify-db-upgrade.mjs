import { config } from "dotenv"
import pg from "pg"
import { readdir, readFile } from "node:fs/promises"
import { PrismaClient, Prisma } from "../lib/generated/prisma/index.js"
import { PrismaPg } from "@prisma/adapter-pg"

config({ path: ".env.local", quiet: true })
const files = (await readdir(".local-backups")).filter((name) => /^pre-upgrade-\d+\.json$/.test(name)).sort()
if (!files.length) throw new Error("No pre-upgrade snapshot")
const snapshot = JSON.parse(await readFile(`.local-backups/${files.at(-1)}`, "utf8"))
const client = new pg.Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL })
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
try {
  await client.connect()
  await client.query("BEGIN READ ONLY")
  for (const [table, before] of Object.entries(snapshot.tables)) {
    if (table === "_prisma_migrations") continue
    const quoted = '"' + table.replaceAll('"', '""') + '"'
    const { rows } = await client.query(`SELECT row_to_json(t)::text AS data FROM public.${quoted} t`)
    const after = new Map(rows.map(({ data }) => { const row = JSON.parse(data); return [row.id, row] }))
    const changed = new Set()
    for (const old of before) {
      const current = after.get(old.id)
      if (!current) throw new Error(`Missing row in ${table}`)
      for (const key of Object.keys(old)) {
        if (JSON.stringify(old[key]) !== JSON.stringify(current[key])) changed.add(key)
      }
    }
    console.log(`${table}: preserved ${before.length}/${before.length} IDs; changed existing columns: ${[...changed].join(", ") || "none"}`)
  }
  await client.query("ROLLBACK")
  for (const model of Prisma.dmmf.datamodel.models) {
    const delegate = model.name[0].toLowerCase() + model.name.slice(1)
    await prisma[delegate].findFirst()
    console.log(`Prisma runtime read OK: ${model.name}`)
  }
} catch (error) {
  console.error("Verification failed:", error.code || error.name)
  process.exitCode = 1
} finally {
  await client.end()
  await prisma.$disconnect()
  await pool.end()
}
