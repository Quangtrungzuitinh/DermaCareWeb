// node scripts/book-patient-demo.mjs
// Demo: upload ảnh da → tạo lịch cho bác sĩ hehe → xem AI section ở doctor view
import { chromium } from 'playwright'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'

const BASE = 'http://localhost:3000'
const SHOTS = 'C:/tmp/demo'
const SKIN_IMAGE = 'C:/Users/Trung/Downloads/mans-problematic-skin-pore-dark-600nw-2741418839.webp'
// Doctor hehe@gmail.com — doctorId=36, Mon-Fri 08:00-17:00
const CONFIRM_URL = `${BASE}/booking/confirm?mode=doctor&doctorId=36&date=2026-05-26&slot=08%3A00%20-%2008%3A30`

mkdirSync(SHOTS, { recursive: true })

async function shot(page, name, label) {
  const p = join(SHOTS, `${name}.png`)
  await page.screenshot({ path: p, fullPage: false })
  console.log(`  📸 [${label}] → ${p}`)
}

console.log('\n╔═════════════════════════════════════════════════╗')
console.log('║  Demo: Bệnh nhân mới + AI Skin Analysis        ║')
console.log('╚═════════════════════════════════════════════════╝\n')

if (!existsSync(SKIN_IMAGE)) {
  console.error(`❌ Không tìm thấy ảnh: ${SKIN_IMAGE}`)
  process.exit(1)
}

const browser = await chromium.launch({ headless: false, slowMo: 200 })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

// ══ Phần A: Chụp màn hình tính năng AI upload ══════════════════════════════
console.log('── A. Tính năng AI Upload (booking select) ──\n')

await page.goto(`${BASE}/booking/select`, { waitUntil: 'networkidle' })
await shot(page, '01-select-initial', 'Trang chọn bác sĩ — ban đầu')

// Upload ảnh da thật
const fileInput = page.locator('input[type="file"][accept="image/*"]')
await fileInput.setInputFiles(SKIN_IMAGE)
console.log('  → Đã upload ảnh da thật, chờ AI phân tích...')
await shot(page, '02-uploading', 'Đang phân tích')

// Chờ AI xong (timeout = 15s, fallback nếu HF blocked)
await page.waitForFunction(() => {
  const box = document.querySelector('.border-dashed.border-blue-200')
  return box && !box.textContent?.includes('AI đang phân tích')
}, { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(1000)
await shot(page, '03-ai-done', 'Kết quả AI (fallback vì HF blocked)')

const aiBox = await page.textContent('.border-dashed.border-blue-200').catch(() => '')
console.log(`  AI box: "${(aiBox ?? '').trim().slice(0, 80)}"`)

// Chụp section dividers (cuộn xuống để thấy danh sách bác sĩ)
await page.mouse.wheel(0, 300)
await page.waitForTimeout(600)
await shot(page, '04-doctor-sections', 'Section dividers: AI gợi ý vs Bác sĩ khác')

// ══ Phần B: Tạo appointment — dùng trực tiếp URL confirm ═══════════════════
console.log('\n── B. Tạo lịch hẹn cho bác sĩ hehe ──\n')

// Inject ai_skin TRƯỚC khi navigate đến confirm
// (simulate HF trả về kết quả thật — locally bị block nên inject thủ công)
await page.addInitScript(() => {
  sessionStorage.setItem('ai_skin', JSON.stringify({
    condition: 'Psoriasis',
    confidence: 0.87,
  }))
})

await page.goto(CONFIRM_URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await shot(page, '05-confirm-page', 'Trang xác nhận')

// Check ai_skin vẫn còn trong sessionStorage
const storedAi = await page.evaluate(() => sessionStorage.getItem('ai_skin'))
console.log(`  sessionStorage ai_skin: ${storedAi ?? 'null'}`)

// Điền thông tin bệnh nhân — click Sửa (patient info section, first button)
const allSuaButtons = page.locator('button:has-text("Sửa")')
const suaCount = await allSuaButtons.count()
console.log(`  Tìm thấy ${suaCount} nút "Sửa"`)

// Click nút Sửa đầu tiên (Thông tin bệnh nhân)
if (suaCount > 0) {
  await allSuaButtons.first().click()
  await page.waitForTimeout(600)
  await shot(page, '06-edit-mode', 'Chế độ chỉnh sửa bệnh nhân')

  // Điền họ tên
  const nameInput = page.locator('input[type="text"]').first()
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('Bệnh Nhân Demo')
  }
  // Điền email (type="email")
  const emailInput = page.locator('input[type="email"]').first()
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill('benhnhan@demo.com')
  }
  // Điền SĐT (input[type="text"] thứ 2)
  const phoneInput = page.locator('input[type="text"]').nth(1)
  if (await phoneInput.isVisible().catch(() => false)) {
    await phoneInput.fill('0901234567')
  }

  console.log('  → Điền: Bệnh Nhân Demo, benhnhan@demo.com, 0901234567')

  // Lưu
  const saveBtn = page.locator('button:has-text("Lưu")').first()
  if (await saveBtn.isVisible().catch(() => false)) {
    await saveBtn.click()
    await page.waitForTimeout(600)
    console.log('  → Đã Lưu thông tin')
  }
}

// Tick đồng ý điều khoản
const checkbox = page.locator('input[type="checkbox"]').first()
if (await checkbox.isVisible().catch(() => false)) {
  await checkbox.check()
  console.log('  → Đã đồng ý điều khoản')
}
await page.waitForTimeout(500)
await shot(page, '07-ready-to-confirm', 'Sẵn sàng xác nhận')

// Kiểm tra button có enabled chưa
const confirmBtn = page.locator('button').filter({ hasText: /thanh toán/i }).last()
const isEnabled = await confirmBtn.isEnabled().catch(() => false)
console.log(`  Nút Tiếp tục: ${isEnabled ? '✅ enabled' : '❌ disabled'}`)

if (isEnabled) {
  await confirmBtn.click()
  console.log('  → Đã click Tiếp tục thanh toán')
  await page.waitForTimeout(6000)
  const payUrl = page.url()
  console.log(`  → URL: ${payUrl}`)
  await shot(page, '08-payment-or-success', 'Kết quả sau submit')

  // Lấy appointment ID từ URL
  const apptId = payUrl.split('/').filter(Boolean).pop()
  if (apptId && apptId.length > 10) {
    console.log(`\n  ✅ Appointment ID: ${apptId}`)
    console.log(`  → Bác sĩ hehe vào /doctor/appointments sẽ thấy lịch này`)
    console.log(`  → Trong detail dialog có section "🔬 Phân tích da AI"`)

    // Thử xem doctor view (sẽ redirect đến login nếu chưa đăng nhập)
    console.log('\n── C. Doctor View (cần đăng nhập) ──')
    await page.goto(`${BASE}/doctor/appointments`, { waitUntil: 'networkidle' })
    const url = page.url()
    console.log(`  URL doctor appointments: ${url}`)
    await shot(page, '09-doctor-view', 'Doctor appointments (cần login)')
    console.log('\n  Để xem AI section trong doctor view:')
    console.log('  1. Đăng nhập: hehe@gmail.com')
    console.log('  2. Vào /doctor/appointments')
    console.log(`  3. Click appointment ngày 26/05/2026 08:00`)
    console.log('  4. Xem section "🔬 Phân tích da AI":')
    console.log('     Phát hiện: Psoriasis')
    console.log('     Độ tự tin: 87%  ████████░░')
    console.log('     ⚠️  Chỉ mang tính tham khảo')
  }
} else {
  console.log('\n  ⚠️  Button vẫn disabled — chụp màn hình để debug')
  // Print all visible button states
  const btns = await page.locator('button').all()
  for (const btn of btns.slice(0, 10)) {
    const t = await btn.textContent().catch(() => '')
    const en = await btn.isEnabled().catch(() => false)
    if (t?.trim()) console.log(`    button "${t.trim().slice(0,30)}": ${en ? 'enabled' : 'disabled'}`)
  }
}

console.log('\n╔═════════════════════════════════════════════════╗')
console.log('║  Demo hoàn thành — xem screenshots tại:       ║')
console.log(`║  ${SHOTS.padEnd(45)} ║`)
console.log('╚═════════════════════════════════════════════════╝\n')
console.log('[Browser đang mở để xem trực tiếp — nhấn Ctrl+C để thoát]\n')
