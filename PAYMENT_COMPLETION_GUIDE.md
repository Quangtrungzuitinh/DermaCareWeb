# PAYMENT FLOW - Hướng dẫn Hoàn thiện

**Tài liệu này mô tả luồng thanh toán cọc lịch hẹn (BR-001) và những gì cần setup để hoàn thiện.**

---

## 1. Tổng quan luồng thanh toán hiện tại

### 1.1 Business Rule
- **BR-001:** Cọc cố định **100.000 VNĐ** (không ngoại lệ, không hoàn tiền một phần)
- Thanh toán qua **SePay Webhook** hoặc xác nhận thủ công từ **Staff**
- Trạng thái: `PENDING_PAYMENT` → `CONFIRMED` → `COMPLETED` (khi hoàn khám)

### 1.2 Kiến trúc hiện tại

```
┌─────────────────────┐
│  Booking Form       │
└──────────┬──────────┘
           │ createAppointment()
           ▼
┌─────────────────────────────────────┐
│ Appointment (PENDING_PAYMENT)       │
│ - baseFee = 100.000 VNĐ             │
│ - appointmentDate                   │
│ - patientId (null = Guest)          │
└──────────┬──────────────────────────┘
           │
           ▼ Payment page
┌─────────────────────────────────────┐
│ /booking/payment/[appointmentId]    │
│ - Generate QR (SePay Static)        │
│ - Display: bankName, accountNo, etc │
│ - Polling status setiap 2 detik     │
└──────────┬──────────────────────────┘
           │ (User transfer money)
           │
      ┌────▼─────────────────────────────┐
      │   SePay Webhook Listener          │
      │   POST /api/webhook               │
      │   - Verify Authorization          │
      │   - Extract "CK {22char}" from    │
      │     memo (content/description)    │
      │   - Match partialAppointmentId    │
      │   - Call confirmPayment()         │
      └────┬─────────────────────────────┘
           │ (or manual via Staff)
           │
           ▼
┌────────────────────────────────────────┐
│ confirmPayment() - ACID Transaction     │
│ 1. Verify appointment status            │
│ 2. Create Payment record                │
│ 3. Update Appointment → CONFIRMED       │
│ 4. Create MedicalRecord (first time)    │
│ 5. Notify patient                       │
└──────────┬───────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ Appointment (CONFIRMED)                │
│ - Ready for doctor consultation        │
│ - Patient can view appointment detail  │
└────────────────────────────────────────┘
```

### 1.3 Các thành phần chính

| Thành phần | File | Vai trò |
|---|---|---|
| QR Generator | `lib/sepay-deposit-qr.ts` | Tạo URL QR từ SePay API |
| QR Component | `components/payment/PaymentQR.tsx` | Hiển thị QR + thông tin tài khoản |
| Countdown | `components/payment/PaymentCountdown.tsx` | Đếm ngược thời gian (15 phút) |
| Payment Action | `lib/actions/payment.actions.ts` | Core: `confirmPayment()` - ACID transaction |
| Webhook Handler | `app/api/webhook/route.ts` | Listen SePay notifications |
| Page | `app/(public)/booking/payment/[id]/page.tsx` | UI chính + polling |
| Polling Hook | `hooks/usePaymentPolling.ts` | Long-polling trạng thái |
| Schema | `prisma/schema.prisma` | `Appointment`, `Payment`, `Notification` |

---

## 2. Setup Requirements

### 2.1 Environment Variables (`.env.local`)

```bash
# SePay Account
SEPAY_ACCOUNT_NO="1005123456789"                    # Số tài khoản
SEPAY_ACCOUNT_NAME="CLINIC ABC"                     # Tên chủ tài khoản
SEPAY_BANK_CODE="MB"                                # MB (MBBank) hoặc VIETCOMBANK, v.v.
SEPAY_BANK_ID="MB"                                  # Alternative to BANK_CODE
SEPAY_BANK_DISPLAY_NAME="Ngân hàng Quân đội (MB)"   # Label hiển thị

# Webhook Security
WEBHOOK_SECRET="your-secret-key-here"               # Key từ SePay Dashboard
                                                     # PHẢI khớp: SePay sẽ gửi
                                                     # Authorization: apikey {WEBHOOK_SECRET}

# Database & Auth (đã config)
DATABASE_URL="postgresql://...@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@aws-0-ap-southeast-1.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."                     # Server-side only
```

### 2.2 Ngrok Tunnel Setup (Local Dev)

```bash
# 1. Cài ngrok (nếu chưa)
# macOS: brew install ngrok
# Linux: wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip
#        unzip && sudo mv ngrok /usr/local/bin

# 2. Mở cửa sổ terminal riêng, chạy tunnel
ngrok http 3000
# Output:
# Forwarding     https://xxxx-xx-xxx-xx-xxx.ngrok.io -> http://localhost:3000

# 3. Copy ngrok URL vào SePay Dashboard:
#    https://[project].sepay.vn/dashboard
#    Webhook URL: https://xxxx-xx-xxx-xx-xxx.ngrok.io/api/webhook

# 4. Giữ ngrok chạy trong suốt testing
```

### 2.3 SePay Dashboard Configuration

1. **Đăng ký tài khoản SePay:**
   - URL: https://sepay.vn
   - Điền thông tin ngân hàng (account, bank code)

2. **Lấy API credentials:**
   - API Key (nếu dùng)
   - Bank code (ví dụ: `MB`, `VIETCOMBANK`)

3. **Cấu hình Webhook:**
   - Webhook URL: `https://[ngrok-url]/api/webhook`
   - Webhook Secret: Tùy chọn (ghi vào `WEBHOOK_SECRET`)
   - Event types: `TRANSFER` (chuyển khoản đến)

4. **QR Code:**
   - SePay cung cấp QR tĩnh dựa trên account
   - Mỗi chuyển khoản được gán `Nội dung` = `CK {22 ký tự cuối appointment ID}`
   - Webhook parse `CK` pattern từ memo/description

### 2.4 Supabase Setup

#### 2.4.1 Bảng Cơ sở dữ liệu (Migrations)

Chạy:
```bash
npx prisma migrate dev
```

Kiểm tra bảng được tạo:
- `appointments` (baseFee = 100000 default)
- `payments` (status, confirmationSource, confirmedAt)
- `notifications` (notify patient khi payment confirmed)

#### 2.4.2 RLS Policies

Kiểm tra `prisma/rls_policies.sql`:
- `Patient` chỉ SELECT `appointments` của chính mình
- `Guest` không cần auth → có thể POST booking
- `Staff` SELECT `appointments` để xác nhận thanh toán thủ công
- `Doctor` chỉ SELECT `CONFIRMED` appointments

#### 2.4.3 pg_cron (Optional: Auto-cancel nếu không thanh toán)

Thiết lập trong Supabase SQL Editor:
```sql
-- Auto-cancel after 15 minutes PENDING_PAYMENT
SELECT cron.schedule(
  'auto_cancel_pending_payment',
  '*/5 * * * *',  -- Chạy mỗi 5 phút
  $$
    UPDATE appointments
    SET status = 'CANCELLED'
    WHERE status = 'PENDING_PAYMENT'
      AND created_at < NOW() - INTERVAL '15 minutes';
  $$
);
```

---

## 3. Checklist - Hoàn thiện Payment Flow

### 3.1 Lõi nghiệp vụ

- [ ] **BR-001 Applied:** Mỗi appointment mặc định `baseFee = 100000`
  - Kiểm tra: `prisma/schema.prisma` → `Appointment.baseFee @default(100000)`
  
- [ ] **confirmPayment() ACID Transaction:**
  - [ ] 1️⃣ Resolve appointment ID (handle guest + member)
  - [ ] 2️⃣ Verify status is `PENDING_PAYMENT`
  - [ ] 3️⃣ Create `Payment` record với `confirmedAt`, `confirmationSource`
  - [ ] 4️⃣ Update appointment → `CONFIRMED`
  - [ ] 5️⃣ Create `MedicalRecord` (first time entry)
  - [ ] 6️⃣ Notify patient
  - Kiểm tra: `lib/actions/payment.actions.ts` ✅

- [ ] **QR Generation:**
  - [ ] Static QR từ SePay API
  - [ ] Content format: `CK {22 ký tự cuối ID}`
  - Kiểm tra: `lib/sepay-deposit-qr.ts` ✅

- [ ] **Webhook Handler:**
  - [ ] Verify `Authorization: apikey {WEBHOOK_SECRET}`
  - [ ] Parse "CK" pattern từ memo fields
  - [ ] Idempotent: Handle retry (duplicate webhooks)
  - [ ] Return HTTP 201 (not 200) để SePay biết đã received
  - Kiểm tra: `app/api/webhook/route.ts` ✅

### 3.2 Frontend

- [ ] **Payment Page (`/booking/payment/[id]`):**
  - [ ] Display QR image
  - [ ] Show banking details (account, bank name, amount)
  - [ ] Copy button cho "Nội dung chuyển khoản"
  - [ ] Countdown timer (15 phút)
  - [ ] Polling status mỗi 2 detik
  - Kiểm tra: `app/(public)/booking/payment/[id]/page.tsx`

- [ ] **PaymentQR Component:**
  - [ ] Render QR image unoptimized (từ external URL)
  - [ ] Info rows: ngân hàng, tài khoản, nội dung
  - [ ] Copy icon + visual feedback
  - Kiểm tra: `components/payment/PaymentQR.tsx` ✅

- [ ] **PaymentCountdown Component:**
  - [ ] Đếm ngược 15 phút
  - [ ] Visual warning (màu đỏ khi < 1 phút)
  - [ ] Message khi hết thời gian
  - Kiểm tra: `components/payment/PaymentCountdown.tsx`

- [ ] **Polling Hook (`usePaymentPolling`):**
  - [ ] Poll `/api/appointment/[id]/status` mỗi 2 detik
  - [ ] Stop polling khi status = `CONFIRMED` hoặc hết thời gian
  - [ ] Handle error gracefully
  - Kiểm tra: `hooks/usePaymentPolling.ts`

### 3.3 Staff Manual Confirmation

- [ ] **Staff Payment Page (`/staff/payments`):**
  - [ ] List pending payments
  - [ ] Button "Xác nhận thanh toán thủ công"
  - [ ] Trigger `confirmPayment()` với `source: MANUAL`
  - [ ] Optional: Upload evidence (screenshot transfer)
  - Kiểm tra: `app/(staff)/payments/page.tsx` hoặc `components/staff/PaymentsView.tsx`

### 3.4 Notifications

- [ ] **Patient Notification:**
  - [ ] Create `Notification` khi payment confirmed
  - [ ] Title: "Thanh toán thành công"
  - [ ] Body: "Lịch hẹn đã được xác nhận"
  - [ ] Type: `PAYMENT_CONFIRMED`
  - Kiểm tra: `notifyPaymentConfirmed()` trong `services/notification.service.ts`

- [ ] **Doctor Notification (Onboarding):**
  - [ ] Notify doctor khi profile approved
  - [ ] Include: doctor ID, approval status, first appointment date
  - Kiểm tra: `notifyDoctorApproved()` trong notification service

### 3.5 Error Handling & Edge Cases

- [ ] **Appointment not found:**
  - Webhook returns `HTTP 201` (graceful rejection)
  - Not logged as failure (avoid noise)

- [ ] **Invalid amount:**
  - Webhook rejects if `amount < baseFee`
  - Idempotent: Duplicate webhook (same transaction) → returns `HTTP 201`

- [ ] **No "CK" pattern in memo:**
  - Webhook skips (not our transaction)
  - Returns `HTTP 201`

- [ ] **Wrong transfer direction:**
  - Webhook skips if `transferType !== "in"`
  - Returns `HTTP 201`

- [ ] **Payment already confirmed:**
  - `confirmPayment()` detects idempotent state
  - Returns `{ idempotent: true }` instead of error

### 3.6 Database Integrity

- [ ] **Unique Payment per Appointment:**
  - Schema: `Payment.appointmentId @unique`
  - Ensures one payment per appointment

- [ ] **RLS for Payments:**
  - `Staff` can SELECT all `payments`
  - `Patient` can SELECT own `payments`
  - No one can DELETE payments (read-only after creation)

- [ ] **Transaction Rollback:**
  - If any step fails, entire `confirmPayment()` rolls back
  - DB remains in clean state

---

## 4. Implementation Details

### 4.1 Key Functions & Files

#### `lib/actions/payment.actions.ts`

```typescript
interface ConfirmPaymentParams {
  appointmentId?: string                // CUID full
  partialAppointmentId?: string         // Last 22 chars
  confirmedById: string | null          // Staff ID (null = webhook)
  amount: number                         // Amount in VNĐ
  source: ConfirmationSource            // 'WEBHOOK' | 'MANUAL'
}

export async function confirmPayment(params): Promise<{
  success: boolean
  idempotent?: boolean
  appointmentId: string
}>
```

**Workflow:**
1. Resolve appointment ID (handle both full & partial)
2. Load appointment, check status
3. If already `CONFIRMED` → return `{ idempotent: true }`
4. If not `PENDING_PAYMENT` → throw error
5. Verify amount >= baseFee
6. Inside transaction:
   - Create Payment
   - Update Appointment → CONFIRMED
   - Create MedicalRecord
   - Notify patient
7. Return success

#### `app/api/webhook/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // 1. Verify Authorization header
  if (!isValidSepayApiKey(authHeader, WEBHOOK_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // 2. Parse & normalize payload
  const payload = normalizeSepayPayload(rawBody)
  if (!payload) return new Response(null, { status: 201 })
  
  // 3. Filter: only "in" transfers
  if (payload.transferType !== "in") return new Response(null, { status: 201 })
  
  // 4. Extract "CK {22 chars}" from memo
  const match = memo.match(/CK\s+([a-z0-9]{22})/i)
  if (!match) return new Response(null, { status: 201 })
  
  // 5. Call confirmPayment()
  await confirmPayment({
    partialAppointmentId: match[1],
    amount: parseTransferAmountVnd(payload.transferAmount),
    confirmedById: null,
    source: ConfirmationSource.WEBHOOK,
  })
  
  // 6. Return HTTP 201
  return new Response(null, { status: 201 })
}
```

#### `lib/sepay-deposit-qr.ts`

```typescript
export function generateSepayDepositQRImageUrl(
  appointmentId: string,
  amount: number
): string {
  const url = new URL("https://qr.sepay.vn/img")
  url.searchParams.set("acc", SEPAY_ACCOUNT_NO)
  url.searchParams.set("bank", SEPAY_BANK_CODE)
  url.searchParams.set("amount", String(amount))
  url.searchParams.set("des", `CK ${appointmentId.slice(-22)}`)
  return url.toString()
}

export function getSepayDepositDetails(
  appointmentId: string,
  amount: number
): SepayDepositDetails {
  return {
    qrUrl: generateSepayDepositQRImageUrl(appointmentId, amount),
    amount,
    addInfo: buildSepayTransferContent(appointmentId),  // "CK ..."
    bankName: SEPAY_BANK_DISPLAY_NAME,
    accountNo: SEPAY_ACCOUNT_NO,
    accountName: SEPAY_ACCOUNT_NAME,
  }
}
```

### 4.2 Payment Page Flow

```typescript
// app/(public)/booking/payment/[id]/page.tsx

export default async function PaymentPage({ params }) {
  const appointmentId = params.id
  
  // 1. Fetch appointment (public read allowed via RLS)
  const appointment = await getAppointment(appointmentId)
  
  // 2. Check status
  if (appointment.status === 'CONFIRMED') {
    return <Success /> // Already paid
  }
  if (appointment.status !== 'PENDING_PAYMENT') {
    return <Error /> // Wrong status
  }
  
  // 3. Generate QR
  const qrDetails = getSepayDepositDetails(appointmentId, appointment.baseFee)
  
  return (
    <ClientPaymentComponent
      appointmentId={appointmentId}
      qrDetails={qrDetails}
      baseFee={appointment.baseFee}
    />
  )
}
```

**Client Component:**
```typescript
"use client"

export function ClientPaymentComponent({ appointmentId, qrDetails, baseFee }) {
  const { status, isLoading } = usePaymentPolling(appointmentId)
  
  if (status === 'CONFIRMED') {
    return <PaymentSuccess />
  }
  
  return (
    <div>
      <PaymentQR {...qrDetails} />
      <PaymentCountdown duration={15 * 60} onExpire={handleExpire} />
      {isLoading && <Spinner />}
    </div>
  )
}
```

### 4.3 Polling Implementation

```typescript
// hooks/usePaymentPolling.ts

export function usePaymentPolling(appointmentId: string) {
  const [status, setStatus] = useState<AppointmentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/appointment/${appointmentId}/status`)
        const data = await res.json()
        setStatus(data.status)
        
        // Stop polling when confirmed
        if (data.status === 'CONFIRMED') {
          clearInterval(interval)
        }
      } catch (error) {
        // Retry on error
      }
    }, 2000) // Poll every 2 seconds
    
    return () => clearInterval(interval)
  }, [appointmentId])
  
  return { status, isLoading }
}
```

---

## 5. Lỗi Thường Gặp & Cách Fix

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| QR code không hiển thị | SePay API down hoặc domain block | Dùng static QR từ SePay Dashboard, generate offline |
| Webhook không nhận | Ngrok URL sai hoặc WEBHOOK_SECRET mismatch | Verify ngrok URL trong SePay Dashboard match `ngrok http 3000` output |
| "CK pattern not found" | Memo không chứa "CK" prefix | Verify nội dung chuyển khoản = `CK {22 chars}` |
| Payment idempotent loop | SePay retry 7 lần, duplicate webhooks | Code xử lý idempotent ✅ (return HTTP 201) |
| Appointment still PENDING_PAYMENT | Payment created nhưng status không update | Check transaction rollback → xem error log |
| RLS policy block payment create | Supabase RLS quá strict | Grant `INSERT` trên `payments` table cho authenticated users |
| UUID vs Text mismatch | `auth.uid()` = UUID, profile ID = Text | Cast: `auth.uid()::text` trong RLS queries |

---

## 6. Testing Payment Flow

### 6.1 Manual Testing Checklist

#### Step 1: Setup Ngrok
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Run ngrok
ngrok http 3000
# Copy URL: https://xxxx-yyyy-zzzz.ngrok.io
```

#### Step 2: Configure SePay
1. Go to https://[project].sepay.vn/dashboard
2. Set Webhook URL: `https://[ngrok-url]/api/webhook`
3. Copy API Key → set as `WEBHOOK_SECRET`

#### Step 3: Create Booking
```bash
# Create appointment (PENDING_PAYMENT)
curl -X POST http://localhost:3000/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "doctor_2024xxxx",
    "appointmentDate": "2024-06-15T14:00:00Z",
    "guestName": "John Doe",
    "guestPhone": "0901234567"
  }'
# Returns: { appointmentId: "xxx...xxx" }
```

#### Step 4: Open Payment Page
```
http://localhost:3000/booking/payment/xxx...xxx
```
- Should display QR code
- Should show: account, amount, content

#### Step 5: Simulate Payment (via VietQR mobile or test tool)
```bash
# Option A: Manual via bank app
# Scan QR → Transfer 100.000 VNĐ with memo: CK [last 22 chars]

# Option B: Curl test (simulating SePay webhook)
curl -X POST http://localhost:3000/api/webhook \
  -H "Authorization: apikey your-webhook-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "transferType": "in",
    "transferAmount": 100000,
    "content": "CK '$(appointmentId | cut -c-22)'",
    "accountNumber": "1005123456789"
  }'
```

#### Step 6: Verify Status Change
```bash
# Poll appointment status
curl http://localhost:3000/api/appointment/xxx.../status

# Expected: { status: "CONFIRMED" }
```

#### Step 7: Check Notifications
- Navigate to `/patient/dashboard`
- Should see notification: "Thanh toán thành công"

### 6.2 Automated Testing

```typescript
// __tests__/payment.test.ts

describe("Payment Flow", () => {
  it("should confirm payment via webhook", async () => {
    // 1. Create appointment
    const appt = await createAppointment(...)
    expect(appt.status).toBe("PENDING_PAYMENT")
    
    // 2. Send webhook
    const res = await fetch("/api/webhook", {
      method: "POST",
      headers: { "Authorization": `apikey ${WEBHOOK_SECRET}` },
      body: JSON.stringify({ ... })
    })
    expect(res.status).toBe(201)
    
    // 3. Verify appointment updated
    const updated = await getAppointment(appt.id)
    expect(updated.status).toBe("CONFIRMED")
    
    // 4. Verify payment created
    const payment = await getPayment(appt.id)
    expect(payment.status).toBe("CONFIRMED")
    expect(payment.confirmationSource).toBe("WEBHOOK")
  })
  
  it("should handle duplicate webhooks idempotently", async () => {
    // Send same webhook twice
    const res1 = await sendWebhook(...)
    const res2 = await sendWebhook(...)
    
    // Both should return 201
    expect(res1.status).toBe(201)
    expect(res2.status).toBe(201)
    
    // Only one payment record
    const payments = await db.payment.findMany()
    expect(payments.length).toBe(1)
  })
})
```

---

## 7. Monitoring & Debugging

### 7.1 Webhook Logs

Enable logging in `app/api/webhook/route.ts`:
```typescript
logger.info("[Webhook/SePay] Payment confirmation processed", {
  status: "confirmed",
  partialId: match[1],
  amount,
  timestamp: new Date().toISOString()
})
```

Check logs:
```bash
# Terminal output from npm run dev
# Look for: [Webhook/SePay] ...

# Or via Supabase Dashboard
# Logs → Webhooks section
```

### 7.2 Database Inspection

```sql
-- Check pending payments
SELECT id, status, created_at
FROM appointments
WHERE status = 'PENDING_PAYMENT'
ORDER BY created_at DESC
LIMIT 10;

-- Check confirmed payments
SELECT a.id, p.amount, p.confirmed_at, p.confirmation_source
FROM payments p
JOIN appointments a ON p.appointment_id = a.id
ORDER BY p.confirmed_at DESC
LIMIT 10;

-- Check notification
SELECT id, title, body, created_at
FROM notifications
WHERE type = 'PAYMENT_CONFIRMED'
ORDER BY created_at DESC
LIMIT 5;
```

### 7.3 Ngrok Inspection

Ngrok provides web inspector:
```
http://localhost:4040  # Web UI
```
- View all incoming webhook requests
- See request/response bodies
- Replay webhooks for testing

---

## 8. Phần tiếp theo & Future Improvements

### 8.1 MVP Hoàn tất (In Scope)
- ✅ Static QR + SePay Webhook
- ✅ Manual confirmation via Staff
- ✅ Idempotent payment handling
- ✅ ACID transaction guarantee
- ✅ Patient notification

### 8.2 Future Enhancements (Out of Scope)
- [ ] Multiple payment methods (e-wallet, card, bank transfer)
- [ ] Partial refund support
- [ ] Promo codes / discounts
- [ ] Subscription-based appointments
- [ ] Real-time analytics dashboard
- [ ] Payment SMS confirmation

---

## 9. Reference Links

| Item | URL |
|---|---|
| SePay Docs | https://sepay.vn/docs |
| Supabase Realtime | https://supabase.com/docs/guides/realtime |
| Next.js Server Actions | https://nextjs.org/docs/app-router/server-actions |
| Prisma Transactions | https://www.prisma.io/docs/orm/prisma-client/queries/transactions |
| Ngrok Docs | https://ngrok.com/docs |

---

## 10. Responsible Person & Contacts

| Role | Name | Email |
|---|---|---|
| Dev Lead | [Your Name] | [email] |
| QA | [QA Team] | [email] |
| DevOps | [DevOps Team] | [email] |

---

**Last Updated:** 24-May-2026  
**Status:** MVP - Payment Flow Complete ✅  
**Next Phase:** Deployment & Load Testing
