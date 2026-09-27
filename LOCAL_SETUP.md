# Chạy thử trên Windows với Supabase hiện có

`.env.local` trên máy này đã có cấu hình Auth và PostgreSQL.
Khi thiết lập máy khác, lấy `DATABASE_URL` và `DIRECT_URL` từ Supabase → Connect.
Public/publishable key không thay thế mật khẩu PostgreSQL.
Runtime hiện đọc `NEXT_PUBLIC_SUPABASE_ANON_KEY`, kể cả khi dùng publishable key.

## Kết quả nâng cấp database hiện có (27/09/2026)

- Đã kết nối và áp dụng đầy đủ 23 migration trong repo; `db:status` báo up to date.
- Baseline `20260423145656_init_schema_with_fixes` tương đương nội dung migration
  `20260422142358_init_schema_with_fixes` đã áp dụng trên DB cũ.
- Đã thêm hai cột consent một lần và ghi nhận cả hai migration consent tương ứng.
- Giữ nguyên lịch sử migration cũ và các cột `serviceFeePaidAt`, `serviceFeePaidById`
  của appointments (code hiện tại chưa mô tả hai cột này trong Prisma schema).
- Snapshot dữ liệu public trước nâng cấp nằm trong `.local-backups/`, bị Git bỏ qua.
  Đây là snapshot dữ liệu, không phải backup đầy đủ cấu trúc/quyền/Auth như pg_dump.
- Đã đối chiếu: giữ đủ 22 lịch hẹn, 11 bệnh án, 9 thanh toán, 5 hồ sơ, 1 bác sĩ,
  7 lịch làm việc, 5 dịch vụ, 7 điều trị và 1 khoảng khóa lịch.
  Các giá trị cũ không đổi, ngoại trừ `profiles.updatedAt` được migration cập nhật.
- Prisma đọc thành công cả 28 model qua DATABASE_URL runtime.
- Không cần chạy lại thao tác baseline/resolve trên project này.

```powershell
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:inspect
npm.cmd run db:status
```

## Database hiện có

Không chạy các script reset/cleanup hoặc xóa `_prisma_migrations`.
Giữ nguyên các migration cũ để tránh thay đổi checksum trên database đã dùng.
Chỉ chạy `npm.cmd run db:deploy` sau khi đối chiếu schema và lịch sử migration.

Hai migration `20260520100000_add_consent_fields` và
`202605201930_add_consent_fields` cùng thêm hai cột consent. Nếu migration sau
chưa được áp dụng nhưng cả hai cột đã tồn tại với định nghĩa đúng, cần xác minh
và reconcile migration đó trước khi deploy; không chạy deploy mù hoặc reset DB.
Nếu database không có lịch sử Prisma thì phải baseline schema trước.

Các migration phụ thuộc Supabase Auth, `pg_cron` và `vector`.
Không dùng `prisma migrate dev` trên database đang dùng chung.

## Khởi chạy và kiểm tra

```powershell
npm.cmd run dev
# http://localhost:3000
```

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Supabase Auth cần cho phép redirect về `http://localhost:3000` và đường dẫn
callback dùng trong app. Dùng tài khoản đã có trong database; kiểm tra vai trò
ADMIN/STAFF/DOCTOR/PATIENT, bác sĩ active/được duyệt, lịch khám và dịch vụ active.
Không tự seed hoặc đổi quyền người dùng trên database hiện có.

## Tích hợp tùy chọn

Xem `.env.example` cho SePay, Groq, Hugging Face, Google Drive và cron.
Thiếu các khóa này sẽ hạn chế chức năng tương ứng.
Tham khảo `FEATURES_FRONTEND_TESTING_GUIDE.md`, `MEDICAL_RECORDS_TESTING.md`,
`PAYMENT_COMPLETION_GUIDE.md` được lấy từ upstream test-branch; các hướng dẫn
cũ cần đối chiếu với code và cấu hình hiện tại.

Không nhập `.auth/*.json` từ upstream; tạo phiên test mới bằng tài khoản riêng.
Không merge toàn bộ test-branch chỉ để chạy local: branch đó còn thêm trường
ảnh booking vào schema nhưng thiếu migration tương ứng.
