// Seed script: Create doctor schedule rules for testing
// Run: npx tsx prisma/seed-schedules.ts

import pg from "pg"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const client = await pool.connect()

  try {
    // 1. Get all active doctors
    const doctorsResult = await client.query(`
      SELECT dp.id, p."fullName" as full_name, dp.specialty
      FROM doctor_profiles dp
      JOIN profiles p ON dp."profileId" = p.id
      WHERE dp."isActive" = true
    `)

    console.log(`Found ${doctorsResult.rows.length} active doctors:`)
    doctorsResult.rows.forEach((d: { id: string; full_name: string; specialty: string }) =>
      console.log(`  - ${d.id}: ${d.full_name} (${d.specialty})`),
    )

    if (doctorsResult.rows.length === 0) {
      console.log("No doctors found!")
      return
    }

    // 2. Define schedule: Mon-Fri, 08:00-17:00, 30-min slots
    const weekdays = ["MON", "TUE", "WED", "THU", "FRI"]
    const slots = [
      { start: 480, end: 510 }, // 08:00 - 08:30
      { start: 510, end: 540 }, // 08:30 - 09:00
      { start: 540, end: 570 }, // 09:00 - 09:30
      { start: 570, end: 600 }, // 09:30 - 10:00
      { start: 600, end: 630 }, // 10:00 - 10:30
      { start: 630, end: 660 }, // 10:30 - 11:00
      { start: 660, end: 690 }, // 11:00 - 11:30
      { start: 690, end: 720 }, // 11:30 - 12:00
      // Lunch break 12:00 - 13:30
      { start: 810, end: 840 }, // 13:30 - 14:00
      { start: 840, end: 870 }, // 14:00 - 14:30
      { start: 870, end: 900 }, // 14:30 - 15:00
      { start: 900, end: 930 }, // 15:00 - 15:30
      { start: 930, end: 960 }, // 15:30 - 16:00
      { start: 960, end: 990 }, // 16:00 - 16:30
      { start: 990, end: 1020 }, // 16:30 - 17:00
    ]

    // 3. Insert schedule rules
    let created = 0
    let skipped = 0

    for (const doctor of doctorsResult.rows) {
      for (const day of weekdays) {
        for (const slot of slots) {
          try {
            await client.query(
              `
              INSERT INTO doctor_schedule_rules (id, "doctorId", "dayOfWeek", "startMinute", "endMinute", "slotDuration", "maxPatients", "isActive", "createdAt", "updatedAt")
              VALUES (gen_random_uuid()::text, $1, $2::\"DayOfWeek\", $3, $4, 30, 2, true, NOW(), NOW())
              ON CONFLICT ("doctorId", "dayOfWeek", "startMinute") DO NOTHING
            `,
              [doctor.id, day, slot.start, slot.end],
            )
            created++
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            console.log(`  Skip: ${doctor.full_name} ${day} ${slot.start} - ${message}`)
            skipped++
          }
        }
      }
    }

    console.log(`\nDone! Created ${created} schedule rules, skipped ${skipped} existing.`)
    console.log(
      `Each doctor: ${weekdays.length} days x ${slots.length} slots = ${weekdays.length * slots.length} rules.`,
    )
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(console.error)
