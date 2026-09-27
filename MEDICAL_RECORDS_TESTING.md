# Medical Records Testing Guide

## Scope

This guide covers Clinical Records Phase 1-11:

- Encounter check-in and completion
- Draft/finalized medical records
- Prescription separated from treatment billing
- Skin images through Google Drive
- Treatment plans, observations, conditions, follow-up notes
- Granular consent fallback
- Patient timeline and patient-safe progress tracking

## Automated Checks

Run:

```bash
npx prisma validate
npx tsc --noEmit
npm test -- medical-records.test.ts
```

Expected:

- Prisma schema is valid.
- TypeScript has no errors.
- Patient progress projection does not expose raw AI score.
- Observation validation rejects invalid registry values.

## Manual Frontend Flow

1. Staff confirms payment for an appointment.
2. Staff opens appointment detail and clicks `Check-in bệnh nhân`.
3. Appointment status becomes `CHECKED_IN`.
4. Doctor opens appointment detail.
5. Doctor edits diagnosis/notes and adds:
   - Dịch vụ điều trị
   - Đơn thuốc
   - Ảnh da
6. Patient opens `/patient/health-records`.
7. Verify:
   - `Đơn thuốc` tab shows medication data from `prescriptions`.
   - Treatment services are not shown as prescriptions.
   - Skin images appear only for the owning patient.
   - Progress chart shows patient-safe language only.

## Privacy Checks

Patient UI must not show:

- AI disease labels from model output
- confidence score
- raw model score
- raw JSON/reasoning

Patient UI may show:

- image preview
- doctor suggestions
- trend label: `Đang cải thiện`, `Ổn định`, `Cần theo dõi thêm`
- doctor-confirmed progress summary

## Google Drive Setup

Required env vars:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_DRIVE_PARENT_FOLDER_ID=
```

Without these, upload returns `GOOGLE_DRIVE_NOT_CONFIGURED`; other pages should still load.

## AI Progress Pipeline

Phase 11 reuses the deployed Feature D/G skin model:

```env
HF_API_TOKEN=
# or HF_API_KEY=
AI_CONFIDENCE_THRESHOLD=0.10
```

Model: `Jayanth2002/dinov2-base-finetuned-SkinDisease`.

No Anthropic/Claude key is required for this pipeline. Patient UI must continue to show only patient-safe progress, not model labels or confidence.
