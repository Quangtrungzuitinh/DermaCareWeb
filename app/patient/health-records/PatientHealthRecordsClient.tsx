"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Camera,
  Eye,
  FileText,
  HeartPulse,
  Pill,
  Search,
  WalletCards,
} from "lucide-react"

import { PatientShell } from "@/components/patient/PatientShell"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { InsightCard } from "@/components/shared/InsightCard"
import { ListPagination, type PageSize } from "@/components/shared/ListPagination"
import { SortButton, type SortOption } from "@/components/shared/SortButton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import type {
  PatientHealthSummary,
  PatientMedicalDocument,
  PatientMedicalRecord,
  PatientProgressSummary,
  PatientPrescription,
} from "@/services/patient.types"

type HealthRecordSort = "newest" | "oldest" | "doctor" | "total-desc"

const SORT_OPTIONS: SortOption<HealthRecordSort>[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "doctor", label: "Tên bác sĩ" },
  { value: "total-desc", label: "Tổng tiền cao" },
]

export function PatientHealthRecordsClient({
  summary,
  records,
  prescriptions,
  documents,
  progress,
}: {
  summary: PatientHealthSummary
  records: PatientMedicalRecord[]
  prescriptions: PatientPrescription[]
  documents: PatientMedicalDocument[]
  progress: PatientProgressSummary | null
}) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<HealthRecordSort>("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [selectedRecord, setSelectedRecord] = useState<PatientMedicalRecord | null>(null)

  const activePrescriptionCount = prescriptions.filter((item) => item.status === "ACTIVE").length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = q
      ? records.filter((record) => {
          const haystack = [
            record.diagnosis,
            record.notes,
            record.visitReason,
            record.appointment?.doctor.fullName,
            record.appointment?.doctor.specialty,
            record.treatments.map((treatment) => treatment.serviceName).join(" "),
            record.prescriptions
              .flatMap((prescription) => prescription.items.map((item) => item.medicationName))
              .join(" "),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          return haystack.includes(q)
        })
      : records

    return source.slice().sort((a, b) => {
      const dateA = a.appointment?.appointmentDate ?? a.createdAt
      const dateB = b.appointment?.appointmentDate ?? b.createdAt
      if (sort === "oldest") return +new Date(dateA) - +new Date(dateB)
      if (sort === "doctor") {
        return (a.appointment?.doctor.fullName ?? "").localeCompare(
          b.appointment?.doctor.fullName ?? "",
          "vi",
        )
      }
      if (sort === "total-desc") return getTreatmentTotal(b) - getTreatmentTotal(a)
      return +new Date(dateB) - +new Date(dateA)
    })
  }, [query, records, sort])

  const progressRecordId = useMemo(() => findProgressRecordId(records, progress), [records, progress])

  useEffect(() => {
    setPage(1)
  }, [query, sort, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <PatientShell
      title="Hồ sơ"
      description={`${records.length} lần khám đã lưu`}
      profile={summary.profile}
    >
      <div className="mx-auto w-full max-w-[1120px] space-y-5">
        <SummaryStats
          totalVisits={summary.totalVisits}
          latestVisit={summary.latestVisit}
          activePrescriptionCount={activePrescriptionCount}
          documentCount={documents.length}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo bác sĩ, chẩn đoán, dịch vụ, thuốc..."
              className="h-11 w-full rounded-full border border-[#e2e8f0] bg-white pl-9 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] shadow-[0_1px_3px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
            />
          </div>
          <SortButton value={sort} options={SORT_OPTIONS} onChange={setSort} />
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a]">Dòng thời gian khám</h2>
            <p className="text-sm text-[#64748b]">
              Mỗi mốc là một lần khám, bấm xem chi tiết để mở hồ sơ đầy đủ.
            </p>
          </div>
          {filtered.length > 0 && (
            <div className="text-sm font-semibold text-[#475569]">
              {filtered.length} lần khám
            </div>
          )}
        </div>

        <section className="space-y-0">
          {visibleRecords.map((record, index) => (
            <VisitTimelineCard
              key={record.id}
              record={record}
              isLatest={index === 0 && currentPage === 1}
              isFirst={index === 0}
              isLast={index === visibleRecords.length - 1}
              hasMultipleRecords={visibleRecords.length > 1}
              progress={record.id === progressRecordId ? progress : null}
              onViewDetails={() => setSelectedRecord(record)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="rounded-3xl border border-[#eef2f7] bg-white px-5 py-12 text-center text-sm text-[#64748b]">
              {query ? "Không tìm thấy hồ sơ phù hợp." : "Chưa có hồ sơ sức khỏe."}
            </div>
          )}
        </section>

        {filtered.length > 0 && (
          <ListPagination
            total={filtered.length}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="lần khám"
          />
        )}

        <VisitDetailDialog
          record={selectedRecord}
          progress={selectedRecord?.id === progressRecordId ? progress : null}
          onOpenChange={(open) => {
            if (!open) setSelectedRecord(null)
          }}
        />
      </div>
    </PatientShell>
  )
}

function SummaryStats({
  totalVisits,
  latestVisit,
  activePrescriptionCount,
  documentCount,
}: {
  totalVisits: number
  latestVisit: string | null
  activePrescriptionCount: number
  documentCount: number
}) {
  const cards = [
    totalVisits > 0
      ? {
          key: "visits",
          icon: HeartPulse,
          label: "Tổng số lần khám",
          value: String(totalVisits),
          tone: undefined,
        }
      : null,
    latestVisit
      ? {
          key: "latest",
          icon: CalendarDays,
          label: "Lần khám gần nhất",
          value: formatAppointmentDate(latestVisit, "dd/MM/yyyy"),
          tone: "slate" as const,
        }
      : null,
    activePrescriptionCount > 0
      ? {
          key: "prescriptions",
          icon: Pill,
          label: "Đơn thuốc đang dùng",
          value: String(activePrescriptionCount),
          tone: "green" as const,
        }
      : null,
    documentCount > 0
      ? {
          key: "documents",
          icon: FileText,
          label: "Tài liệu y tế",
          value: String(documentCount),
          tone: "amber" as const,
        }
      : null,
  ].filter((card): card is NonNullable<typeof card> => Boolean(card))

  if (cards.length === 0) return null

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <InsightCard
          key={card.key}
          icon={card.icon}
          label={card.label}
          value={card.value}
          tone={card.tone}
        />
      ))}
    </section>
  )
}

function VisitTimelineCard({
  record,
  isLatest,
  isFirst,
  isLast,
  hasMultipleRecords,
  progress,
  onViewDetails,
}: {
  record: PatientMedicalRecord
  isLatest: boolean
  isFirst: boolean
  isLast: boolean
  hasMultipleRecords: boolean
  progress: PatientProgressSummary | null
  onViewDetails: () => void
}) {
  const visitDate = record.appointment?.appointmentDate ?? record.createdAt
  const treatmentTotal = getTreatmentTotal(record)
  const prescriptionItems = record.prescriptions.flatMap((prescription) =>
    prescription.items.map((item) => ({ ...item, prescription })),
  )

  return (
    <article className="grid gap-0 sm:grid-cols-[112px_44px_minmax(0,1fr)]">
      <div className="hidden pt-5 sm:block">
        <div className="sticky top-4 w-fit rounded-2xl border border-[#e2e8f0] bg-white px-3 py-2 text-right shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="text-sm font-bold text-[#0f172a]">
            {formatAppointmentDate(visitDate, "dd/MM")}
          </div>
          <div className="text-xs font-semibold text-[#94a3b8]">
            {formatAppointmentDate(visitDate, "yyyy")}
          </div>
        </div>
      </div>

      <div className="relative hidden justify-center sm:flex">
        {hasMultipleRecords && !isFirst && <div className="absolute top-0 h-7 w-px bg-[#bfdbfe]" />}
        {hasMultipleRecords && !isLast && <div className="absolute bottom-0 top-12 w-px bg-[#bfdbfe]" />}
        <div
          className={`relative z-10 mt-7 flex h-5 w-5 items-center justify-center rounded-full border-4 bg-white ${
            isLatest ? "border-[#2563eb]" : "border-[#93c5fd]"
          }`}
        />
      </div>

      <div className="relative pb-5 sm:pb-7">
        {hasMultipleRecords && <div className="absolute bottom-0 left-[9px] top-0 w-px bg-[#bfdbfe] sm:hidden" />}
        <div className="relative z-10 rounded-3xl border border-[#e5eefb] bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)]">
          <div className="mb-4 flex items-center gap-3 sm:hidden">
            <div
              className={`h-5 w-5 shrink-0 rounded-full border-4 bg-white ${
                isLatest ? "border-[#2563eb]" : "border-[#93c5fd]"
              }`}
            />
            <div>
              <div className="text-sm font-bold text-[#0f172a]">
                {formatAppointmentDate(visitDate, "dd/MM/yyyy")}
              </div>
              <div className="text-xs text-[#64748b]">
                {formatAppointmentDate(visitDate, "HH:mm")}
              </div>
            </div>
          </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#0f172a]">
                {formatAppointmentDate(visitDate, "HH:mm dd/MM/yyyy")}
              </h2>
              {record.appointment && <AppointmentStatusBadge status={record.appointment.status} />}
              {progress && <ProgressChip progress={progress} />}
            </div>
            <p className="mt-1 text-sm font-semibold text-[#334155]">
              {record.appointment?.doctor.fullName ?? "Bác sĩ chưa cập nhật"}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-[#64748b]">
              {record.diagnosis ?? record.visitReason ?? "Chưa cập nhật chẩn đoán"}
            </p>
            <VisitMetaRow
              treatments={record.treatments.length}
              prescriptions={prescriptionItems.length}
              images={record.skinImages.length}
              total={treatmentTotal}
            />
          </div>

          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-[#dbeafe] bg-[#eff6ff] px-4 text-sm font-semibold text-[#1d4ed8] transition-colors hover:bg-[#dbeafe]"
          >
            <Eye className="h-4 w-4" />
            Xem chi tiết
          </button>
        </div>
      </div>
      </div>
    </article>
  )
}

function VisitDetailDialog({
  record,
  progress,
  onOpenChange,
}: {
  record: PatientMedicalRecord | null
  progress: PatientProgressSummary | null
  onOpenChange: (open: boolean) => void
}) {
  if (!record) {
    return <Dialog open={false} onOpenChange={onOpenChange} />
  }

  const visitDate = record.appointment?.appointmentDate ?? record.createdAt
  const treatmentTotal = getTreatmentTotal(record)

  return (
    <Dialog open={Boolean(record)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-[#eef2f7] p-0 sm:max-w-5xl">
        <div className="border-b border-[#eef2f7] px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {record.appointment && <AppointmentStatusBadge status={record.appointment.status} />}
                  {progress && <ProgressChip progress={progress} />}
                </div>
                <DialogTitle className="text-xl font-bold text-[#0f172a]">
                  {formatAppointmentDate(visitDate, "HH:mm dd/MM/yyyy")}
                </DialogTitle>
                <DialogDescription className="text-[#64748b]">
                  {record.appointment?.doctor.fullName ?? "Bác sĩ chưa cập nhật"} ·{" "}
                  {record.diagnosis ?? record.visitReason ?? "Chưa cập nhật chẩn đoán"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <RecordOverview record={record} />
            <TreatmentSection treatments={record.treatments} total={treatmentTotal} />
            <PrescriptionInlineSection prescriptions={record.prescriptions} />
          </div>

          <div className="space-y-6">
            <SkinImageSection images={record.skinImages} progress={progress} />
            <VisitSummary record={record} treatmentTotal={treatmentTotal} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VisitMetaRow({
  treatments,
  prescriptions,
  images,
  total,
}: {
  treatments: number
  prescriptions: number
  images: number
  total: number
}) {
  const items = [
    treatments > 0 ? `${treatments} dịch vụ` : null,
    prescriptions > 0 ? `${prescriptions} thuốc` : null,
    images > 0 ? `${images} ảnh` : null,
    total > 0 ? formatVND(total) : null,
  ].filter(Boolean)

  if (items.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#475569]">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-[#f7f9fc] px-3 py-1">
          {item}
        </span>
      ))}
    </div>
  )
}

function ProgressChip({ progress }: { progress: PatientProgressSummary }) {
  const tone =
    progress.trend === "IMPROVING"
      ? "bg-[#f0fdf4] text-[#15803d]"
      : progress.trend === "WORSENING"
        ? "bg-[#fff7ed] text-[#c2410c]"
        : "bg-[#f1f5f9] text-[#475569]"

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {progress.label}
      {progress.improvementPct !== null ? ` · ${progress.improvementPct}%` : ""}
      {progress.pendingDoctorReview ? " · chờ xác nhận" : ""}
    </span>
  )
}

function RecordOverview({ record }: { record: PatientMedicalRecord }) {
  return (
    <section>
      <SectionTitle icon={FileText} title="Thông tin khám" />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {record.visitReason && <RecordField label="Lý do khám" value={record.visitReason} />}
        <RecordField label="Chẩn đoán" value={record.diagnosis ?? "Chưa cập nhật"} />
        <RecordField
          label="Bác sĩ phụ trách"
          value={record.appointment?.doctor.fullName ?? "Chưa cập nhật"}
        />
        {record.appointment?.doctor.specialty && (
          <RecordField label="Chuyên khoa" value={record.appointment.doctor.specialty} />
        )}
        {record.notes && <RecordField label="Ghi chú bác sĩ" value={record.notes} wide />}
        {record.planDescription && (
          <RecordField label="Kế hoạch điều trị" value={record.planDescription} wide />
        )}
      </div>
    </section>
  )
}

function TreatmentSection({
  treatments,
  total,
}: {
  treatments: PatientMedicalRecord["treatments"]
  total: number
}) {
  return (
    <section>
      <SectionTitle icon={WalletCards} title="Dịch vụ đã làm" />
      {treatments.length > 0 ? (
        <div className="mt-3 divide-y divide-[#f1f5f9]">
          {treatments.map((treatment) => (
            <div key={treatment.id} className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="font-semibold text-[#0f172a]">{treatment.serviceName}</div>
                <div className="mt-1 text-xs text-[#64748b]">
                  SL {treatment.quantity}
                  {treatment.instruction ? ` - ${treatment.instruction}` : ""}
                </div>
              </div>
              <div className="text-right font-semibold text-[#0f172a]">
                {formatVND(treatment.priceAtTime * treatment.quantity)}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 text-sm font-bold text-[#0f172a]">
            <span>Tổng dịch vụ</span>
            <span>{formatVND(total)}</span>
          </div>
        </div>
      ) : (
        <EmptyLine text="Chưa có dịch vụ điều trị." />
      )}
    </section>
  )
}

function PrescriptionInlineSection({
  prescriptions,
}: {
  prescriptions: PatientMedicalRecord["prescriptions"]
}) {
  const items = prescriptions.flatMap((prescription) =>
    prescription.items.map((item) => ({ ...item, prescription })),
  )

  return (
    <section>
      <SectionTitle icon={Pill} title="Đơn thuốc" />
      {items.length > 0 ? (
        <div className="mt-3 divide-y divide-[#f1f5f9]">
          {items.map((item) => (
            <div key={item.id} className="py-3 text-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="font-semibold text-[#0f172a]">{item.medicationName}</div>
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.prescription.status === "ACTIVE"
                      ? "bg-[#f0fdf4] text-[#15803d]"
                      : "bg-[#f1f5f9] text-[#64748b]"
                  }`}
                >
                  {item.prescription.status === "ACTIVE" ? "Đang dùng" : "Đã kết thúc"}
                </span>
              </div>
              <div className="mt-1 text-xs text-[#64748b]">
                {item.dosage} · {item.frequency} · {item.duration}
              </div>
              {item.instruction && <div className="mt-1 text-xs text-[#475569]">{item.instruction}</div>}
              {item.prescription.note && (
                <div className="mt-2 text-xs text-[#64748b]">{item.prescription.note}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyLine text="Chưa có đơn thuốc." />
      )}
    </section>
  )
}

function SkinImageSection({
  images,
  progress,
}: {
  images: PatientMedicalRecord["skinImages"]
  progress: PatientProgressSummary | null
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon={Camera} title="Ảnh tiến triển" />
        {progress && <ProgressChip progress={progress} />}
      </div>
      {images.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
          {images.map((image) => (
            <a
              key={image.id}
              href={`/api/skin-images/${image.id}`}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-2xl border border-[#eef2f7] bg-[#f7f9fc] transition-colors hover:border-[#bfdbfe]"
            >
              <div className="aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.thumbnailUrl ?? `/api/skin-images/${image.id}`}
                  alt={image.bodyArea ?? image.fileName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="px-3 py-2 text-xs text-[#64748b]">
                <div className="truncate font-semibold text-[#334155]">
                  {image.bodyArea ?? "Ảnh da"}
                </div>
                <div>{formatAppointmentDate(image.capturedAt, "dd/MM/yyyy")}</div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <EmptyLine text="Chưa có ảnh theo dõi da." />
      )}
    </section>
  )
}

function VisitSummary({
  record,
  treatmentTotal,
}: {
  record: PatientMedicalRecord
  treatmentTotal: number
}) {
  const hasTreatmentPlan = record.targetSessions && record.targetSessions > 0

  return (
    <section>
      <SectionTitle icon={CalendarDays} title="Tổng kết lần khám" />
      <div className="mt-3 space-y-2 text-sm">
        <DetailRow
          label="Ngày khám"
          value={formatAppointmentDate(record.appointment?.appointmentDate ?? record.createdAt, "dd/MM/yyyy HH:mm")}
        />
        <DetailRow label="Dịch vụ" value={`${record.treatments.length} mục`} />
        {treatmentTotal > 0 && <DetailRow label="Tổng dịch vụ" value={formatVND(treatmentTotal)} strong />}
        {hasTreatmentPlan && (
          <DetailRow
            label="Tiến độ điều trị"
            value={`${record.completedSessions}/${record.targetSessions} buổi`}
          />
        )}
      </div>
    </section>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
      <Icon className="h-4 w-4 text-[#2563eb]" />
      {title}
    </div>
  )
}

function RecordField({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <div className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-[#0f172a]">{value}</div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-[#f1f5f9] pt-2 first:border-t-0 first:pt-0">
      <span className="text-[#64748b]">{label}</span>
      <span className={`text-right ${strong ? "font-bold text-[#0f172a]" : "font-semibold text-[#334155]"}`}>
        {value}
      </span>
    </div>
  )
}

function EmptyLine({ text }: { text: string }) {
  return <div className="mt-3 rounded-2xl bg-[#f7f9fc] px-4 py-4 text-sm text-[#64748b]">{text}</div>
}

function getTreatmentTotal(record: PatientMedicalRecord) {
  return record.treatments.reduce((sum, treatment) => sum + treatment.priceAtTime * treatment.quantity, 0)
}

function findProgressRecordId(records: PatientMedicalRecord[], progress: PatientProgressSummary | null) {
  if (!progress) return null

  const latestProgressTime = new Date(progress.latestCheckedAt).getTime()
  const matchingRecord = records.find((record) =>
    record.skinImages.some((image) => {
      const capturedTime = new Date(image.capturedAt).getTime()
      return Math.abs(capturedTime - latestProgressTime) < 24 * 60 * 60 * 1000
    }),
  )

  return matchingRecord?.id ?? records.find((record) => record.skinImages.length > 0)?.id ?? null
}
