// node scripts/confirm-appt.mjs <appointmentId>
import { readFileSync } from 'fs'

const apptId = process.argv[2]
if (!apptId) { console.error('Usage: node confirm-appt.mjs <appointmentId>'); process.exit(1) }

const env = Object.fromEntries(
  readFileSync('.env', 'utf-8').split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')] })
)

import pg from 'pg'
const pool = new pg.Pool({ connectionString: env.DATABASE_URL })

// 1. Kiểm tra appointment
const { rows: [appt] } = await pool.query(
  `SELECT a.id, a.status, a."guestName", a."appointmentDate", a."aiPredictedCondition", a."aiConfidenceScore",
          d.specialty, p."fullName" as "doctorName"
   FROM appointments a
   JOIN doctor_profiles d ON d.id = a."doctorId"
   JOIN profiles p ON p.id = d."profileId"
   WHERE a.id = $1`,
  [apptId]
)

if (!appt) { console.error('❌ Không tìm thấy appointment:', apptId); await pool.end(); process.exit(1) }

console.log('\nAppointment hiện tại:')
console.log(JSON.stringify(appt, null, 2))

// 2. Tạo payment record và confirm
const { rows: [existing] } = await pool.query(
  `SELECT id FROM payments WHERE "appointmentId" = $1`, [apptId]
)

if (!existing) {
  // Generate cuid-like id using timestamp
  const newId = 'cmp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  await pool.query(
    `INSERT INTO payments (id, "appointmentId", amount, status, "confirmationSource", "confirmedAt")
     VALUES ($1, $2, 100000, 'CONFIRMED', 'MANUAL', NOW())`,
    [newId, apptId]
  )
  console.log('\n✅ Đã tạo payment record (CONFIRMED, MANUAL)')
} else {
  await pool.query(
    `UPDATE payments SET status = 'CONFIRMED', "confirmedAt" = NOW() WHERE "appointmentId" = $1`,
    [apptId]
  )
  console.log('\n✅ Đã update payment → COMPLETED')
}

// 3. Inject AI data + update status → CONFIRMED
await pool.query(
  `UPDATE appointments SET status = 'CONFIRMED', "aiPredictedCondition" = 'Psoriasis', "aiConfidenceScore" = 0.87 WHERE id = $1`,
  [apptId]
)
console.log('✅ Injected AI: Psoriasis 87%')
console.log('✅ Appointment status → CONFIRMED')

// 4. Tạo medical record trống (bác sĩ cần có để nhập chẩn đoán)
const { rows: [mr] } = await pool.query(
  `SELECT id FROM medical_records WHERE "appointmentId" = $1`, [apptId]
)
if (!mr) {
  const mrId = 'cmp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  await pool.query(
    `INSERT INTO medical_records (id, "appointmentId", diagnosis, notes, "updatedAt") VALUES ($1, $2, NULL, NULL, NOW())`,
    [mrId, apptId]
  )
  console.log('✅ Đã tạo medical record trống')
}

// 5. Xác nhận lại
const { rows: [final] } = await pool.query(
  `SELECT a.id, a.status, a."guestName", a."aiPredictedCondition", a."aiConfidenceScore",
          pay.status as "paymentStatus"
   FROM appointments a
   LEFT JOIN payments pay ON pay."appointmentId" = a.id
   WHERE a.id = $1`,
  [apptId]
)
console.log('\nTrạng thái sau khi update:')
console.log(JSON.stringify(final, null, 2))
console.log('\n→ Bác sĩ hehe đăng nhập vào /doctor/appointments sẽ thấy lịch này')
console.log('→ Click vào appointment → thấy section "🔬 Phân tích da AI"')

await pool.end()
