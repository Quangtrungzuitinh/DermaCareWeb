# Features Frontend Testing Guide

Guide này gom cách test các nhóm chức năng:

- Feature D: AI skin upload + doctor pre-screening.
- Feature G: rule-based doctor recommendation.
- Medical Records: encounter, đơn thuốc, ảnh da, timeline health records, progress tracking.
- Yellow Features: Feature 5 Dynamic Waitlist và Feature 6-A Treatment Plan.

## 1. Chuẩn bị chung

### 1.1 Chạy app

```bash
npm install
npx prisma generate
npm run dev
```

Mở:

```text
http://localhost:3000
```

### 1.2 Chạy automated checks

```bash
npx prisma validate
npx tsc --noEmit
npm test
npm test -- medical-records.test.ts
```

Expected:

- Prisma schema valid.
- TypeScript không lỗi.
- `feature5.test.ts`, `feature6a.test.ts`, `medical-records.test.ts` pass.

### 1.3 Env cần có nếu test đầy đủ

```env
HF_API_TOKEN=
# hoặc HF_API_KEY=
AI_CONFIDENCE_THRESHOLD=0.10

GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_DRIVE_PARENT_FOLDER_ID=
```

Nếu thiếu Hugging Face key, AI upload sẽ fallback hoặc báo lỗi nhẹ tùy flow. Nếu thiếu Google Drive env, upload ảnh hồ sơ y tế sẽ không chạy đầy đủ.

### 1.4 Tài khoản và dữ liệu cần chuẩn bị

Cần có ít nhất:

- 1 Patient.
- 1 Doctor active, có lịch hẹn.
- 1 Staff hoặc Admin.
- 1 dịch vụ active.
- 1 appointment `CONFIRMED` để staff check-in.
- 1 waitlist entry `WAITING` nếu test notify hàng chờ.

Không dùng tài khoản patient để xác nhận dữ liệu doctor-only như AI disease label, confidence, raw score.

## 2. Feature D - AI Skin Upload + Doctor Pre-Screening

### D1. Patient upload ảnh da khi chọn bác sĩ

Route:

```text
/booking/select
```

Các bước:

1. Đăng nhập Patient.
2. Vào flow đặt lịch.
3. Mở màn chọn bác sĩ.
4. Upload/chụp một ảnh da ở khu vực phân tích AI.
5. Chờ phân tích hoàn tất.

Expected:

- Có preview ảnh đã upload.
- UI chỉ hiển thị thông tin chung như số bác sĩ phù hợp hoặc bác sĩ được gợi ý.
- Bác sĩ gợi ý được ưu tiên hiển thị trước hoặc có highlight.
- Không hiển thị nhãn bệnh, confidence, JSON AI raw ở patient UI.

Fail nếu patient thấy:

- Tên bệnh như `Melanoma`, `Tinea Nigra`, `Psoriasis`, `Herpes`.
- `% confidence`, `0.xx`, hoặc score AI.
- Field kỹ thuật như `aiPredictedCondition`, `aiConfidenceScore`.

### D2. Patient confirm appointment sau upload AI

Route:

```text
/booking/confirm
```

Các bước:

1. Sau D1, chọn bác sĩ/slot.
2. Vào confirm.
3. Xác nhận tạo appointment.
4. Mở DevTools Console:

```js
sessionStorage.getItem("ai_skin")
```

Expected:

- Appointment tạo thành công.
- `sessionStorage["ai_skin"]` được clear sau create attempt.
- Patient vẫn không thấy nhãn bệnh/score trên confirm/success.

DB check tùy chọn:

```sql
SELECT "aiPredictedCondition", "aiConfidenceScore"
FROM appointments
ORDER BY "createdAt" DESC
LIMIT 1;
```

Expected:

- Nếu AI trả metadata, appointment có 2 field này.
- Nếu không upload ảnh, 2 field này là `NULL`.

### D3. Doctor xem AI pre-screening

Routes:

```text
/doctor/appointments
/doctor/medical-records
```

Các bước:

1. Đăng nhập Doctor được assign appointment.
2. Mở `/doctor/appointments`.
3. Mở appointment vừa tạo từ patient.
4. Tìm panel AI pre-screening.

Expected:

- Doctor thấy ranked prediction labels, confidence bars/scores nếu appointment có AI metadata.
- Có disclaimer AI chỉ để tham khảo.
- High-alert condition có marker cảnh báo nếu model trả về.

Privacy check:

- Đăng nhập Patient, mở `/patient/appointments` và `/patient/health-records`.
- Expected: không thấy AI disease label/confidence/raw prediction.

## 3. Feature G - Rule-Based Doctor Recommendation

Feature G không có trang riêng. Test qua Feature D upload flow.

### G1. Recommendation trả bác sĩ hữu ích

Route:

```text
/booking/select
```

Các bước:

1. Đăng nhập Patient.
2. Upload ảnh da.
3. Quan sát danh sách bác sĩ sau khi phân tích.

Expected:

- Có tối đa 5 bác sĩ được gợi ý.
- Nếu specialty không match label bệnh, vẫn fallback theo seniority và availability.
- Không trả danh sách rỗng khi vẫn còn doctor active.

### G2. Patient không thấy scoring internals

Expected patient không thấy:

- `specialty_match_score`
- `seniority_score`
- `availability_score`
- AI disease keywords.
- JSON predictions.

### G3. Static checks

```bash
rg "CONDITION_TO_SPECIALTY|FALLBACK_SPECIALTY|getFallbackDoctors" lib/actions/skin-analysis.actions.ts
rg "approvalStatus" lib/actions/recommendation.actions.ts
```

Expected:

- Không còn hard-coded old filter.
- Không dùng field `approvalStatus` nếu schema hiện tại không có field này.

## 4. Medical Records - Clinical Flow

### MR1. Staff check-in appointment

Route:

```text
/staff/appointments
```

Điều kiện:

- Appointment đang `CONFIRMED`.

Các bước:

1. Đăng nhập Staff/Admin.
2. Mở `/staff/appointments`.
3. Mở appointment `CONFIRMED`.
4. Bấm `Check-in bệnh nhân`.

Expected:

- Appointment chuyển sang `CHECKED_IN`.
- Encounter được tạo.
- Medical record chuyển hoặc được tạo ở trạng thái `DRAFT`.
- Audit log có action `ENCOUNTER_CREATED`.

DB check tùy chọn:

```sql
SELECT a.status, e.status AS encounter_status, mr.status AS record_status
FROM appointments a
LEFT JOIN encounters e ON e."appointmentId" = a.id
LEFT JOIN medical_records mr ON mr."appointmentId" = a.id
ORDER BY a."updatedAt" DESC
LIMIT 1;
```

### MR2. Doctor cập nhật bệnh án draft

Route:

```text
/doctor/appointments
```

Các bước:

1. Đăng nhập Doctor phụ trách appointment.
2. Mở appointment `CHECKED_IN`.
3. Nhập chẩn đoán, ghi chú, lý do/triệu chứng nếu UI có.
4. Lưu bệnh án.

Expected:

- Lưu thành công khi record còn `DRAFT`.
- Doctor không sửa được appointment không thuộc mình.
- Patient chưa thấy thông tin nhạy cảm ngoài phần được projection ra UI.

### MR3. Doctor tạo đơn thuốc thật

Route:

```text
/doctor/appointments
```

Các bước:

1. Mở appointment/record đang `DRAFT`.
2. Thêm đơn thuốc với ít nhất 1 item:
   - Tên thuốc.
   - Liều dùng.
   - Tần suất.
   - Thời gian.
   - Hướng dẫn nếu có.
3. Lưu.

Expected:

- Data ghi vào `prescriptions` và `prescription_items`.
- Không ghi fake đơn thuốc từ `treatments`.
- Patient thấy đơn thuốc trong đúng thẻ lần khám ở `/patient/health-records`.

DB check:

```sql
SELECT p.id, p."medicalRecordId", COUNT(pi.id) AS item_count
FROM prescriptions p
LEFT JOIN prescription_items pi ON pi."prescriptionId" = p.id
GROUP BY p.id
ORDER BY p."createdAt" DESC
LIMIT 5;
```

### MR4. Doctor/Staff upload ảnh da vào hồ sơ

Route:

```text
/doctor/appointments
```

Điều kiện:

- Patient có consent lưu trữ hồ sơ/ảnh theo cấu hình hiện tại.
- Google Drive env đã cấu hình.

Các bước:

1. Mở record đang `DRAFT`.
2. Upload ảnh `jpeg/png/webp`, nhỏ hơn 10MB.
3. Nhập body area/note nếu UI có.
4. Lưu.

Expected:

- Ảnh được upload lên Drive.
- DB chỉ lưu `driveFileId`, metadata, không lưu base64.
- `/api/skin-images/[id]` stream ảnh full-size qua RBAC.
- Patient chỉ xem được ảnh của chính mình.

Fail nếu:

- Patient khác xem được ảnh.
- Secret Drive/key hiện trong UI/log.
- Ảnh bị hard delete khỏi DB thay vì soft delete khi xóa.

### MR5. Trigger AI progress analysis

Route:

```text
/doctor/appointments
```

Điều kiện:

- Đã có skin image.
- `HF_API_TOKEN` hoặc `HF_API_KEY` có giá trị.
- Patient có consent AI analysis.

Các bước:

1. Doctor mở ảnh da đã upload.
2. Bấm phân tích ảnh nếu UI có nút manual trigger.
3. Chờ kết quả.
4. Doctor xác nhận hoặc override score nếu UI hỗ trợ.

Expected doctor-facing:

- Kết quả được lưu vào `skin_analysis_results`.
- `modelVersion` là `hf:Jayanth2002/dinov2-base-finetuned-SkinDisease`.
- Doctor có thể thấy score/model details nếu UI doctor hiển thị.

Expected patient-facing:

- Patient không thấy condition label/confidence/raw score/reasoning.
- Patient chỉ thấy trạng thái nhỏ trên thẻ khám: `Đang cải thiện`, `Ổn định`, hoặc `Cần theo dõi thêm`.
- Nếu chưa đủ 2 data points, không hiển thị chart/block lớn.

### MR6. Finalize record và complete encounter

Routes:

```text
/doctor/appointments
/staff/appointments
```

Các bước:

1. Doctor nhập đủ chẩn đoán bắt buộc.
2. Finalize medical record.
3. Complete encounter.

Expected:

- `MedicalRecord.status`: `DRAFT -> FINALIZED`.
- `Encounter.status`: `IN_PROGRESS -> COMPLETED`.
- `Appointment.status`: `CHECKED_IN -> COMPLETED`.
- Record finalized không được update trực tiếp.
- Nếu sửa sau finalized, phải dùng amendment flow.

DB check:

```sql
SELECT a.status, e.status AS encounter_status, mr.status AS record_status
FROM appointments a
JOIN encounters e ON e."appointmentId" = a.id
JOIN medical_records mr ON mr."encounterId" = e.id
ORDER BY e."updatedAt" DESC
LIMIT 1;
```

### MR7. Patient xem health records dạng timeline

Route:

```text
/patient/health-records
```

Các bước:

1. Đăng nhập Patient.
2. Mở `/patient/health-records`.
3. Kiểm tra danh sách thẻ theo lần khám.
4. Mở rộng từng thẻ.

Expected:

- Trang là một timeline duy nhất, không còn tabs hồ sơ/đơn thuốc/timeline trùng lặp.
- Mỗi lần khám là một thẻ mở rộng được.
- Trong thẻ có:
  - Chẩn đoán.
  - Dịch vụ đã làm.
  - Đơn thuốc của đúng lần khám.
  - Ảnh tiến triển nếu có.
- Stat card ẩn khi số liệu = 0.
- Progress AI là chip nhỏ trên thẻ khám, không chiếm block riêng.
- Patient không thấy disease labels/confidence/raw AI JSON.

### MR8. Patient dashboard/timeline route cũ

Route:

```text
/patient/dashboard/timeline
```

Expected:

- Không crash.
- Redirect hoặc điều hướng về `/patient/health-records`.

## 5. Yellow Feature 6-A - Treatment Plan Management

### 6A1. Doctor thiết lập phác đồ

Route:

```text
/doctor/appointments
```

Điều kiện:

- Appointment `CONFIRMED` hoặc record còn editable theo logic hiện tại.

Các bước:

1. Đăng nhập Doctor.
2. Mở appointment của mình.
3. Nhập:
   - Chẩn đoán.
   - Ghi chú.
   - Kế hoạch điều trị, ví dụ `Laser CO2 trị mụn ẩn`.
   - Số buổi dự kiến, ví dụ `4`.
4. Bấm lưu bệnh án.
5. Mở `/doctor/medical-records`.
6. Mở hồ sơ vừa cập nhật.

Expected:

- Có phác đồ điều trị.
- Progress hiển thị `0/4`.
- Mô tả plan hiển thị đúng.

DB check:

```sql
SELECT "planDescription", "targetSessions", "completedSessions"
FROM medical_records
ORDER BY "updatedAt" DESC
LIMIT 1;
```

### 6A2. Staff ghi nhận buổi

Route:

```text
/staff/appointments
```

Các bước:

1. Đăng nhập Staff/Admin.
2. Mở appointment có `targetSessions > 0`.
3. Bấm `Ghi nhận buổi`.
4. Lặp lại đến khi đạt target.

Expected:

- `completedSessions` tăng từng lần.
- Không vượt `targetSessions`.
- Khi đủ buổi, nút disable hoặc action báo `PLAN_COMPLETED`.
- Patient thấy tiến độ trong thẻ lần khám ở `/patient/health-records`.

Automated tests:

```bash
npm test -- feature6a.test.ts
```

Expected:

- `calcPlanProgress` đúng.
- `canIncrementSession` chặn `NO_PLAN` và `PLAN_COMPLETED`.

## 6. Yellow Feature 5 - Dynamic Waitlist

### W1. Patient xem hàng chờ

Route:

```text
/patient/waitlist
```

Các bước:

1. Đăng nhập Patient.
2. Mở sidebar `Hàng chờ`.
3. Vào `/patient/waitlist`.

Expected:

- Nếu không có entry: hiển thị empty state.
- Nếu có entry: thấy card dịch vụ, bác sĩ ưu tiên nếu có, status badge.
- Entry `WAITING` hoặc `NOTIFIED` có nút hủy.
- Entry `BOOKED`, `EXPIRED`, `CANCELLED` không cho hủy.

### W2. Patient join waitlist khi không có slot

Route:

```text
/booking/select
```

Các bước:

1. Đăng nhập Patient.
2. Chọn dịch vụ/bác sĩ/ngày không có slot.
3. Nếu UI có nút `Tham gia hàng chờ`, bấm nút.

Expected:

- Tạo `waitlist_entries` status `WAITING`.
- Chặn đăng ký trùng cùng service khi entry đang `WAITING`.
- `/patient/waitlist` hiển thị entry mới.

Nếu UI chưa có nút này, ghi nhận là gap frontend, action `joinWaitlist` đã có.

### W3. Staff hủy lịch và notify waitlist

Route:

```text
/staff/appointments
```

Điều kiện:

- Có ít nhất 1 waitlist entry `WAITING`.
- Có appointment có thể hủy.

Các bước:

1. Đăng nhập Staff/Admin.
2. Mở appointment.
3. Hủy/từ chối appointment.
4. Khi dialog slot giải phóng hiện ra, bấm `Thông báo hàng chờ`.

Expected:

- Entry đầu hàng chờ chuyển `NOTIFIED`.
- `notifiedAt` có giá trị.
- `expiresAt` khoảng `now + 24h`.
- Có notification type `APPOINTMENT`.
- Patient thấy status `NOTIFIED` ở `/patient/waitlist`.

DB check:

```sql
SELECT status, "notifiedAt", "expiresAt"
FROM waitlist_entries
ORDER BY "updatedAt" DESC
LIMIT 5;
```

### W4. Patient hủy waitlist

Route:

```text
/patient/waitlist
```

Các bước:

1. Đăng nhập Patient có entry `WAITING` hoặc `NOTIFIED`.
2. Bấm `Hủy`.

Expected:

- Entry chuyển `CANCELLED`.
- Entry không còn nằm trong nhóm active.
- Không hủy được entry của patient khác.

Automated tests:

```bash
npm test -- feature5.test.ts
```

Expected:

- Cancel eligibility đúng.
- Expiry logic đúng.
- FCFS selection đúng.

## 7. Regression Checklist Theo Role

### Patient

Test các route:

```text
/booking/select
/booking/confirm
/patient/appointments
/patient/health-records
/patient/waitlist
```

Expected:

- Không thấy AI disease labels/confidence/raw score.
- Có thể đặt lịch có hoặc không upload ảnh.
- Health records hiển thị timeline thẻ khám.
- Đơn thuốc nằm trong đúng lần khám.
- Waitlist hiển thị và hủy đúng quyền.

### Doctor

Test các route:

```text
/doctor/appointments
/doctor/medical-records
```

Expected:

- Thấy AI pre-screening nếu appointment có metadata.
- Có thể ghi bệnh án draft.
- Có thể thêm dịch vụ, đơn thuốc, ảnh da nếu record editable.
- Có thể finalize record khi đủ dữ liệu.
- Không sửa trực tiếp record finalized.

### Staff/Admin

Test các route:

```text
/staff/appointments
```

Expected:

- Check-in được appointment confirmed.
- Ghi nhận buổi điều trị.
- Hủy appointment và notify waitlist.
- Không cần thấy patient-only AI upload internals.

## 8. Những lỗi cần bắt khi test

### Privacy failures

- Patient thấy `aiPredictedCondition`.
- Patient thấy disease label hoặc confidence.
- Patient thấy raw JSON/score/reasoning của Phase 11.
- Patient xem được ảnh da của patient khác.

### Clinical workflow failures

- Complete encounter khi record chưa finalized.
- Sửa trực tiếp record finalized.
- Prescription bị fake từ treatment.
- Treatment billing item hiển thị như thuốc.
- Upload ảnh không consent vẫn thành công.

### Waitlist failures

- Join duplicate vẫn tạo thêm entry.
- Patient hủy được entry của người khác.
- Notify waitlist trên appointment chưa cancelled.
- `expiresAt` không phải 24h.

### Frontend UX failures

- `/patient/health-records` quay lại 3 tab trùng lặp.
- Stat card hiện `0`.
- Progress AI là block lớn riêng thay vì chip nhỏ trong thẻ khám.
- Text vỡ layout ở mobile.
- Table ngang khó đọc trên mobile thay vì card/timeline.

## 9. Báo cáo kết quả test

Khi test thủ công, ghi theo format:

```md
## Test Run - YYYY-MM-DD

Environment:
- Branch:
- Commit:
- DB:
- Browser:

Automated:
- prisma validate:
- tsc:
- npm test:
- medical-records.test:

Manual:
- Feature D:
- Feature G:
- Medical Records:
- Feature 6-A:
- Feature 5:

Bugs:
1. Route:
   Steps:
   Expected:
   Actual:
   Screenshot:
   Severity:
```
