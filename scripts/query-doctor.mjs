// node scripts/query-doctor.mjs
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env', 'utf-8').split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')] })
)
import pg from 'pg'
const pool = new pg.Pool({ connectionString: env.DATABASE_URL })

// Doctor info
const { rows: [doc] } = await pool.query(`
  SELECT p.id, p."fullName", p.email, p.role, d.id as "doctorId", d.specialty, d."isActive"
  FROM profiles p
  LEFT JOIN doctor_profiles d ON d."profileId" = p.id
  WHERE p.email = 'hehe@gmail.com'
`)
console.log('Doctor:', JSON.stringify(doc, null, 2))

// Schedule rules
const { rows: rules } = await pool.query(`
  SELECT "dayOfWeek", "startMinute", "endMinute", "slotDuration", "maxPatients", "isActive"
  FROM doctor_schedule_rules WHERE "doctorId" = $1 AND "isActive" = true
`, [doc.doctorId])
console.log('\nSchedule rules:', JSON.stringify(rules, null, 2))

// Blocked slots (next 7 days)
const { rows: blocked } = await pool.query(`
  SELECT "blockedDate", "startMinute", "endMinute"
  FROM doctor_blocked_slots WHERE "doctorId" = $1 AND "blockedDate" >= NOW()
  ORDER BY "blockedDate" LIMIT 10
`, [doc.doctorId])
console.log('\nBlocked slots:', JSON.stringify(blocked, null, 2))

await pool.end()
