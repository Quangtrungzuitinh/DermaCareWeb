"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Eye, Search } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AiPredictionPanel } from "@/components/shared/AiPredictionPanel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { ListPagination, type PageSize } from "@/components/shared/ListPagination"
import { SortButton, type SortOption } from "@/components/shared/SortButton"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import { getPatientName } from "@/lib/appointment-utils"
import { DetailRow } from "@/components/shared/DetailRow"
import { RecordField } from "@/components/shared/medical-records/RecordField"
import { TreatmentServicesPanel } from "@/components/shared/medical-records/TreatmentServicesPanel"
import { ClinicalEditPanel } from "@/components/shared/appointments/ClinicalEditPanel"
import {
  addTreatment,
  incrementCompletedSessions,
  updateMedicalRecord,
} from "@/lib/actions/treatment.actions"
import { createPrescription } from "@/lib/actions/prescription.actions"
import { deleteSkinImage, uploadSkinImage } from "@/lib/actions/skin-image.actions"
import { recordAppointmentImageStorageConsent } from "@/lib/actions/consent-record.actions"
import { doctorConfirmPatientPresent, finalizeRecord } from "@/lib/actions/encounter.actions"
import { AppointmentStatus, MedicalRecordStatus } from "@/lib/generated/prisma"
import type { UiAppointment, UiService } from "@/services/clinic.types"

type MedicalRecordSort = "newest" | "oldest" | "patient" | "total-desc"

const SORT_OPTIONS: SortOption<MedicalRecordSort>[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "patient", label: "Tên bệnh nhân" },
  { value: "total-desc", label: "Tổng tiền cao" },
]

export function DoctorMedicalRecordsClient({
  rows,
  clinicalServices,
}: {
  rows: UiAppointment[]
  clinicalServices: UiService[]
}) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<MedicalRecordSort>("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [selected, setSelected] = useState<UiAppointment | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = q
      ? rows.filter((appointment) => {
          const patientName = getPatientName(appointment).toLowerCase()
          const diagnosis = appointment.medicalRecord?.diagnosis?.toLowerCase() ?? ""
          const phone = appointment.patient?.phone ?? appointment.guestPhone ?? ""
          return patientName.includes(q) || diagnosis.includes(q) || phone.includes(q)
        })
      : rows

    return source.slice().sort((a, b) => {
      if (sort === "oldest") return +new Date(a.appointmentDate) - +new Date(b.appointmentDate)
      if (sort === "patient") return getPatientName(a).localeCompare(getPatientName(b), "vi")
      if (sort === "total-desc") return getTreatmentTotal(b) - getTreatmentTotal(a)
      return +new Date(b.appointmentDate) - +new Date(a.appointmentDate)
    })
  }, [query, rows, sort])

  useEffect(() => {
    setPage(1)
  }, [query, sort, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên, SĐT, chẩn đoán..."
            className="h-11 w-full rounded-full border border-[#e2e8f0] bg-white pl-9 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] shadow-[0_1px_3px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
          />
        </div>
        <SortButton value={sort} options={SORT_OPTIONS} onChange={setSort} />
      </div>

      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]">Dòng thời gian hồ sơ</h2>
          <p className="text-sm text-[#64748b]">
            Mỗi mốc là một lần khám. Mở chi tiết để ghi bệnh án, kê thuốc, tải ảnh và confirm.
          </p>
        </div>
        {filtered.length > 0 && (
          <div className="text-sm font-semibold text-[#475569]">{filtered.length} hồ sơ</div>
        )}
      </div>

      <section className="space-y-0">
        {visibleRows.map((appointment, index) => (
          <DoctorRecordTimelineCard
            key={appointment.id}
            appointment={appointment}
            isLatest={index === 0 && currentPage === 1}
            isFirst={index === 0}
            isLast={index === visibleRows.length - 1}
            hasMultipleRecords={visibleRows.length > 1}
            onViewDetails={() => setSelected(appointment)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-[#eef2f7] bg-white px-5 py-12 text-center text-sm text-[#64748b]">
            {query ? "Không tìm thấy hồ sơ phù hợp." : "Chưa có hồ sơ bệnh án."}
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
          itemLabel="hồ sơ"
        />
      )}

      <MedicalRecordDialog
        appointment={selected}
        clinicalServices={clinicalServices}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}

function DoctorRecordTimelineCard({
  appointment,
  isLatest,
  isFirst,
  isLast,
  hasMultipleRecords,
  onViewDetails,
}: {
  appointment: UiAppointment
  isLatest: boolean
  isFirst: boolean
  isLast: boolean
  hasMultipleRecords: boolean
  onViewDetails: () => void
}) {
  const record = appointment.medicalRecord
  const treatments = record?.treatments ?? []
  const prescriptions = record?.prescriptions ?? []
  const skinImages = record?.skinImages ?? []
  const total = getTreatmentTotal(appointment)
  const statusTone =
    record?.status === MedicalRecordStatus.FINALIZED
      ? "bg-[#f0fdf4] text-[#15803d]"
      : "bg-[#fffbeb] text-[#b45309]"

  return (
    <article className="grid gap-0 sm:grid-cols-[112px_44px_minmax(0,1fr)]">
      <div className="hidden pt-5 sm:block">
        <div className="sticky top-4 w-fit rounded-2xl border border-[#e2e8f0] bg-white px-3 py-2 text-right shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="text-sm font-bold text-[#0f172a]">
            {formatAppointmentDate(appointment.appointmentDate, "dd/MM")}
          </div>
          <div className="text-xs font-semibold text-[#94a3b8]">
            {formatAppointmentDate(appointment.appointmentDate, "yyyy")}
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
                {formatAppointmentDate(appointment.appointmentDate, "dd/MM/yyyy")}
              </div>
              <div className="text-xs text-[#64748b]">
                {formatAppointmentDate(appointment.appointmentDate, "HH:mm")}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-[#0f172a]">
                  {formatAppointmentDate(appointment.appointmentDate, "HH:mm dd/MM/yyyy")}
                </h2>
                <AppointmentStatusBadge status={appointment.status} />
                {record && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
                    {record.status === MedicalRecordStatus.FINALIZED ? "Đã confirm" : "Draft"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-semibold text-[#334155]">
                {getPatientName(appointment)}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-[#64748b]">
                {record?.diagnosis ?? appointment.visitReason ?? appointment.notes ?? "Chưa cập nhật chẩn đoán"}
              </p>
              <VisitMetaRow
                treatments={treatments.length}
                prescriptions={prescriptions.reduce((sum, item) => sum + item.items.length, 0)}
                images={skinImages.length}
                total={total}
              />
            </div>

            <button
              type="button"
              onClick={onViewDetails}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-[#dbeafe] bg-[#eff6ff] px-4 text-sm font-semibold text-[#1d4ed8] transition-colors hover:bg-[#dbeafe]"
            >
              <Eye className="h-4 w-4" />
              Xem / ghi hồ sơ
            </button>
          </div>
        </div>
      </div>
    </article>
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

function MedicalRecordDialog({
  appointment,
  clinicalServices,
  onOpenChange,
}: {
  appointment: UiAppointment | null
  clinicalServices: UiService[]
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [incrementError, setIncrementError] = useState("")
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")
  const [consentMessage, setConsentMessage] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const record = appointment?.medicalRecord
  const treatments = record?.treatments ?? []
  const prescriptions = record?.prescriptions ?? []
  const total = appointment ? getTreatmentTotal(appointment) : 0
  const prescriptionItemCount = prescriptions.reduce(
    (sum, prescription) => sum + prescription.items.length,
    0,
  )
  const visitStarted = appointment
    ? new Date(appointment.appointmentDate).getTime() <= Date.now()
    : false
  const canEditClinical =
    Boolean(record) &&
    record?.status !== MedicalRecordStatus.FINALIZED &&
    appointment?.status === AppointmentStatus.CHECKED_IN
  const canFinalize =
    Boolean(record) &&
    record?.status !== MedicalRecordStatus.FINALIZED &&
    Boolean(record?.diagnosis?.trim()) &&
    Boolean(record?.encounterId)

  useEffect(() => {
    setActionError("")
    setActionSuccess("")
    setConsentMessage("")
    setIncrementError("")
  }, [appointment?.id])

  function handleIncrementSessions() {
    if (!record) return
    setIncrementError("")
    setActionSuccess("")
    startTransition(async () => {
      try {
        await incrementCompletedSessions(record.id)
        setActionSuccess("Đã cập nhật tiến độ phác đồ.")
        router.refresh()
      } catch (err) {
        setIncrementError(err instanceof Error ? err.message : "Không thể cập nhật buổi.")
      }
    })
  }

  function handleSaveRecord(
    diagnosis: string,
    notes: string,
    planDescription: string,
    targetSessions: number | null,
  ) {
    if (!record) return
    setActionError("")
    setActionSuccess("")
    startTransition(async () => {
      try {
        await updateMedicalRecord(record.id, {
          diagnosis,
          notes,
          planDescription,
          targetSessions,
        })
        setActionSuccess("Đã lưu bệnh án.")
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Không thể lưu bệnh án.")
      }
    })
  }

  function handleAddTreatment(serviceId: string, quantity: number, notes: string) {
    if (!record) return
    setActionError("")
    setActionSuccess("")
    startTransition(async () => {
      try {
        await addTreatment(record.id, serviceId, quantity, notes)
        setActionSuccess("Đã thêm dịch vụ điều trị.")
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Không thể thêm dịch vụ.")
      }
    })
  }

  function handleCreatePrescription(item: {
    medicationName: string
    dosage: string
    frequency: string
    duration: string
    instruction: string
  }) {
    if (!record) return
    setActionError("")
    setActionSuccess("")
    startTransition(async () => {
      try {
        await createPrescription({ medicalRecordId: record.id, items: [item] })
        setActionSuccess("Đã thêm thuốc vào đơn.")
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Không thể thêm đơn thuốc.")
      }
    })
  }

  function handleUploadSkinImage(formData: FormData) {
    if (!record) return
    setActionError("")
    setActionSuccess("")
    if (!appointment?.patient) {
      setActionError("Cần nhờ staff/admin nối khách vãng lai với tài khoản bệnh nhân trước khi lưu ảnh da.")
      return
    }
    formData.set("medicalRecordId", record.id)
    startTransition(async () => {
      try {
        await uploadSkinImage(formData)
        setActionSuccess("Đã tải ảnh da lên hồ sơ.")
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải ảnh da."
        setActionError(
          message.includes("CONSENT_REQUIRED:STORE_SKIN_IMAGE")
            ? "Bệnh nhân chưa đồng ý lưu ảnh da. Hãy ghi nhận consent trước khi tải ảnh."
            : message,
        )
      }
    })
  }

  function handleDeleteSkinImage(skinImageId: string) {
    setActionError("")
    setActionSuccess("")
    startTransition(async () => {
      try {
        await deleteSkinImage(skinImageId)
        setActionSuccess("Đã gỡ ảnh da khỏi hồ sơ.")
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Không thể gỡ ảnh da.")
      }
    })
  }

  function handleRecordImageConsent() {
    if (!appointment) return
    setConsentMessage("")
    setActionError("")
    startTransition(async () => {
      try {
        await recordAppointmentImageStorageConsent(appointment.id)
        setConsentMessage("Đã ghi nhận bệnh nhân đồng ý lưu ảnh da.")
        router.refresh()
      } catch (err) {
        setConsentMessage(err instanceof Error ? err.message : "Không thể ghi nhận consent.")
      }
    })
  }

  function handleConfirmPresence() {
    if (!appointment) return
    setActionError("")
    setActionSuccess("")
    startTransition(async () => {
      try {
        await doctorConfirmPatientPresent(appointment.id)
        setActionSuccess("Đã xác nhận bệnh nhân có mặt. Có thể ghi hồ sơ.")
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Không thể xác nhận bệnh nhân có mặt.")
      }
    })
  }

  function handleFinalizeRecord() {
    if (!record) return
    setActionError("")
    startTransition(async () => {
      try {
        await finalizeRecord(record.id)
        setConfirmOpen(false)
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Không thể chốt hồ sơ.")
      }
    })
  }

  return (
    <>
    <Dialog open={Boolean(appointment)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-[#eef2f7] p-0 sm:max-w-6xl">
        {appointment && (
          <>
            {/* Sticky header — stays visible while scrolling */}
            <div className="sticky top-0 z-10 border-b border-[#eef2f7] bg-white px-6 py-4">
              <DialogHeader className="space-y-1 text-left">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pr-8">
                  <DialogTitle className="text-xl font-bold text-[#0f172a]">
                    {getPatientName(appointment)}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <AppointmentStatusBadge status={appointment.status} />
                    {record && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          record.status === MedicalRecordStatus.FINALIZED
                            ? "bg-[#f0fdf4] text-[#15803d]"
                            : "bg-[#fffbeb] text-[#b45309]"
                        }`}
                      >
                        {record.status === MedicalRecordStatus.FINALIZED ? "Đã confirm" : "Draft"}
                      </span>
                    )}
                  </div>
                </div>
                <DialogDescription className="text-sm text-[#64748b]">
                  Hồ sơ khám ngày {formatAppointmentDate(appointment.appointmentDate, "dd/MM/yyyy HH:mm")}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div>
              <section className="space-y-5 px-6 py-5">
                {record && (
                  <ClinicalEditPanel
                    appointment={appointment}
                    clinicalServices={clinicalServices}
                    canEditClinical={canEditClinical}
                    visitStarted={visitStarted}
                    isPending={isPending}
                    onSaveRecord={handleSaveRecord}
                    onAddTreatment={handleAddTreatment}
                    onCreatePrescription={handleCreatePrescription}
                    onUploadSkinImage={handleUploadSkinImage}
                  />
                )}

                {actionError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {actionError}
                  </div>
                )}
                {actionSuccess && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    {actionSuccess}
                  </div>
                )}

                {/* Diagnosis summary — always visible */}
                <div className="rounded-2xl border border-[#eef2f7] p-4">
                  <h3 className="text-sm font-semibold text-[#0f172a]">Tóm tắt bệnh án</h3>
                  <div className="mt-3 space-y-3 text-sm text-[#334155]">
                    <RecordField label="Chẩn đoán" value={record?.diagnosis ?? "Chưa cập nhật"} />
                    <RecordField label="Ghi chú" value={record?.notes ?? "Chưa cập nhật"} />
                    <RecordField
                      label="Lý do khám"
                      value={appointment.visitReason ?? appointment.notes ?? "Chưa ghi nhận"}
                    />
                  </div>
                </div>

                {/* Treatment plan — only when set */}
                {record && (record.planDescription || record.targetSessions) && (
                  <TreatmentPlanSummary
                    record={record}
                    isPending={isPending}
                    incrementError={incrementError}
                    onIncrement={handleIncrementSessions}
                  />
                )}

                {/* Services + Prescriptions side by side */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <TreatmentServicesPanel treatments={treatments} />
                  <PrescriptionSummary prescriptions={prescriptions} />
                </div>

                {/* Skin images — last so summary reads first */}
                {record && (
                  <SkinImageManager
                    images={record.skinImages}
                    isPending={isPending}
                    onDelete={handleDeleteSkinImage}
                  />
                )}
              </section>

              <aside className="space-y-4 border-t border-[#eef2f7] bg-[#f8fafc] px-6 py-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryTile label="Dịch vụ" value={`${treatments.length} mục`} />
                  <SummaryTile label="Thuốc" value={`${prescriptionItemCount} mục`} />
                  <SummaryTile label="Tổng dịch vụ" value={formatVND(total)} strong />
                  <SummaryTile label="Cọc phí" value={formatVND(appointment.baseFee)} />
                </div>

                {appointment.status === AppointmentStatus.CONFIRMED && (
                  <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                    <h3 className="text-sm font-semibold text-cyan-950">
                      Xác nhận bệnh nhân có mặt
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-cyan-800">
                      Bác sĩ cần xác nhận bệnh nhân đã có mặt trước khi ghi bệnh án, kê thuốc hoặc
                      tải ảnh.
                    </p>
                    <button
                      type="button"
                      onClick={handleConfirmPresence}
                      disabled={isPending}
                      className="mt-3 h-10 w-full rounded-full bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
                    >
                      Bệnh nhân đã có mặt
                    </button>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                  <div className="rounded-2xl border border-[#eef2f7] bg-white p-4">
                    <h3 className="text-sm font-semibold text-[#0f172a]">Thông tin bệnh nhân</h3>
                    <div className="mt-3 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2">
                      <DetailRow label="Họ tên" value={getPatientName(appointment)} />
                      <DetailRow
                        label="SĐT"
                        value={appointment.patient?.phone ?? appointment.guestPhone ?? "—"}
                      />
                      <DetailRow
                        label="Email"
                        value={appointment.patient?.email ?? appointment.guestEmail ?? "—"}
                      />
                      <DetailRow
                        label="Khu vực"
                        value={
                          [appointment.patient?.district, appointment.patient?.province]
                            .filter(Boolean)
                            .join(", ") || "—"
                        }
                      />
                    </div>
                    {appointment.patient && (
                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                        <div className="text-xs font-semibold text-blue-900">Consent ảnh da</div>
                        <p className="mt-1 text-xs leading-relaxed text-blue-800">
                          Dùng khi bệnh nhân đồng ý cho phòng khám lưu ảnh da phục vụ hồ sơ điều trị.
                        </p>
                        <button
                          type="button"
                          onClick={handleRecordImageConsent}
                          disabled={isPending}
                          className="mt-2 h-8 rounded-full border border-blue-300 bg-white px-3 text-xs font-semibold text-primary transition hover:bg-blue-50 disabled:opacity-60"
                        >
                          Ghi nhận đồng ý lưu ảnh
                        </button>
                        {consentMessage && (
                          <p className="mt-2 text-xs text-blue-800">{consentMessage}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <AiPredictionPanel
                    aiPredictedCondition={appointment.aiPredictedCondition}
                  />
                </div>

                {record && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-green-900">Chốt hồ sơ</h3>
                      <p className="mt-1 text-xs leading-relaxed text-green-800">
                        Sau khi confirm, hồ sơ sẽ được khóa. Muốn sửa sau đó cần amendment.
                      </p>
                      {!canFinalize && record.status !== MedicalRecordStatus.FINALIZED && (
                        <p className="mt-2 text-xs text-green-800">
                          Cần check-in và nhập chẩn đoán trước khi confirm.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(true)}
                      disabled={isPending || !canFinalize}
                      className="mt-3 h-10 w-full rounded-full bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto sm:px-6"
                    >
                      Confirm hồ sơ
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent className="rounded-3xl border border-[#eef2f7] bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm hồ sơ bệnh án?</AlertDialogTitle>
          <AlertDialogDescription>
            Hồ sơ của {appointment ? getPatientName(appointment) : "bệnh nhân"} sẽ được chốt và
            không thể sửa trực tiếp. Hãy kiểm tra chẩn đoán, dịch vụ, đơn thuốc và ảnh trước khi
            xác nhận.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleFinalizeRecord}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

function SummaryTile({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[#eef2f7] bg-[#f7f9fc] px-4 py-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">{label}</div>
      <div className={`mt-1 text-sm ${strong ? "font-bold text-[#0f172a]" : "font-semibold text-[#334155]"}`}>
        {value}
      </div>
    </div>
  )
}

function TreatmentPlanSummary({
  record,
  isPending,
  incrementError,
  onIncrement,
}: {
  record: NonNullable<UiAppointment["medicalRecord"]>
  isPending: boolean
  incrementError: string
  onIncrement: () => void
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <h3 className="text-sm font-semibold text-primary">Phác đồ điều trị</h3>
      <div className="mt-3 space-y-2 text-sm">
        {record.planDescription && <RecordField label="Mô tả" value={record.planDescription} />}
        {record.targetSessions && (
          <>
            <RecordField
              label="Tiến độ"
              value={`${record.completedSessions} / ${record.targetSessions} buổi`}
            />
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-400 transition-all"
                style={{
                  width: `${Math.min(100, Math.round((record.completedSessions / record.targetSessions) * 100))}%`,
                }}
              />
            </div>
            <button
              type="button"
              onClick={onIncrement}
              disabled={isPending || record.completedSessions >= record.targetSessions}
              className="mt-1 h-8 rounded-full border border-blue-300 bg-white px-3 text-xs font-semibold text-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + 1 buổi hoàn thành
            </button>
            {incrementError && <p className="text-xs text-red-600">{incrementError}</p>}
          </>
        )}
      </div>
    </div>
  )
}

function PrescriptionSummary({
  prescriptions,
}: {
  prescriptions: NonNullable<UiAppointment["medicalRecord"]>["prescriptions"]
}) {
  const items = prescriptions.flatMap((prescription) => prescription.items)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#eef2f7]">
      <div className="border-b border-[#eef2f7] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#0f172a]">Đơn thuốc đã kê</h3>
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-[#f1f5f9]">
          {items.map((item) => (
            <div key={item.id} className="px-4 py-3 text-sm">
              <div className="font-semibold text-[#0f172a]">{item.medicationName}</div>
              <div className="mt-1 text-xs text-[#64748b]">
                {item.dosage} · {item.frequency} · {item.duration}
              </div>
              {item.instruction && (
                <div className="mt-1 text-xs text-[#475569]">{item.instruction}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-[#64748b]">Chưa có đơn thuốc.</div>
      )}
    </div>
  )
}

function SkinImageManager({
  images,
  isPending,
  onDelete,
}: {
  images: NonNullable<UiAppointment["medicalRecord"]>["skinImages"]
  isPending: boolean
  onDelete: (skinImageId: string) => void
}) {
  return (
    <div className="rounded-2xl border border-[#eef2f7] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#eef2f7] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[#0f172a]">Ảnh tiến triển</h3>
          <p className="mt-0.5 text-xs text-[#64748b]">
            Ảnh đã lưu có thể gỡ khỏi hồ sơ khi tải nhầm.
          </p>
        </div>
        <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">
          {images.length} ảnh
        </span>
      </div>

      {images.length > 0 ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-2xl border border-[#e2e8f0]">
              <a
                href={`/api/skin-images/${image.id}`}
                target="_blank"
                rel="noreferrer"
                className="block aspect-[4/3] bg-[#f8fafc]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.thumbnailUrl ?? `/api/skin-images/${image.id}`}
                  alt={image.bodyArea ?? image.fileName}
                  className="h-full w-full object-cover"
                />
              </a>
              <div className="space-y-2 px-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-[#0f172a]">
                    {image.bodyArea ?? "Chưa ghi vùng da"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#64748b]">
                    {formatAppointmentDate(image.capturedAt, "dd/MM/yyyy HH:mm")}
                  </div>
                </div>
                {image.note && <p className="line-clamp-2 text-xs text-[#475569]">{image.note}</p>}
                <button
                  type="button"
                  onClick={() => onDelete(image.id)}
                  disabled={isPending}
                  className="h-8 w-full rounded-full border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Gỡ ảnh
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-[#64748b]">
          Chưa có ảnh da trong hồ sơ này.
        </div>
      )}
    </div>
  )
}

function getTreatmentTotal(appointment: UiAppointment) {
  return (appointment.medicalRecord?.treatments ?? []).reduce(
    (sum, treatment) => sum + treatment.priceAtTime * treatment.quantity,
    0,
  )
}
