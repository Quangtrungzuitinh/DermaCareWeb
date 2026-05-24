"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatVND } from "@/lib/format"
import type { UiAppointment, UiService } from "@/services/clinic.types"

type ActiveStep = 1 | 2 | 3 | 4
type PendingSkinImage = {
  id: string
  file: File | null
  bodyArea: string
  note: string
}

const STEPS: Array<{ step: ActiveStep; title: string; description: string }> = [
  { step: 1, title: "Bệnh án", description: "Chẩn đoán, ghi chú và phác đồ." },
  { step: 2, title: "Dịch vụ", description: "Dịch vụ đã thực hiện trong lần khám." },
  { step: 3, title: "Đơn thuốc", description: "Thuốc, liều dùng và hướng dẫn." },
  { step: 4, title: "Ảnh da", description: "Nhiều ảnh tiến triển trong một lượt." },
]

function createImageRow(): PendingSkinImage {
  return {
    id: crypto.randomUUID(),
    file: null,
    bodyArea: "",
    note: "",
  }
}

export function ClinicalEditPanel({
  appointment,
  clinicalServices,
  canEditClinical,
  visitStarted,
  isPending,
  onSaveRecord,
  onAddTreatment,
  onCreatePrescription,
  onUploadSkinImage,
}: {
  appointment: UiAppointment
  clinicalServices: UiService[]
  canEditClinical: boolean
  visitStarted: boolean
  isPending: boolean
  onSaveRecord: (
    diagnosis: string,
    notes: string,
    planDescription: string,
    targetSessions: number | null,
  ) => void
  onAddTreatment: (serviceId: string, quantity: number, notes: string) => void
  onCreatePrescription: (item: {
    medicationName: string
    dosage: string
    frequency: string
    duration: string
    instruction: string
  }) => void
  onUploadSkinImage: (formData: FormData) => void
}) {
  const [diagnosis, setDiagnosis] = useState(appointment.medicalRecord?.diagnosis ?? "")
  const [recordNotes, setRecordNotes] = useState(appointment.medicalRecord?.notes ?? "")
  const [planDescription, setPlanDescription] = useState(
    appointment.medicalRecord?.planDescription ?? "",
  )
  const [targetSessions, setTargetSessions] = useState<number | "">(
    appointment.medicalRecord?.targetSessions ?? "",
  )
  const [serviceId, setServiceId] = useState(clinicalServices[0]?.id ?? "")
  const [quantity, setQuantity] = useState(1)
  const [treatmentNotes, setTreatmentNotes] = useState("")
  const [medicationName, setMedicationName] = useState("")
  const [dosage, setDosage] = useState("")
  const [frequency, setFrequency] = useState("")
  const [duration, setDuration] = useState("")
  const [instruction, setInstruction] = useState("")
  const [activeStep, setActiveStep] = useState<ActiveStep | null>(null)
  const [imageRows, setImageRows] = useState<PendingSkinImage[]>(() => [createImageRow()])

  const activeMeta = useMemo(
    () => STEPS.find((item) => item.step === activeStep) ?? null,
    [activeStep],
  )

  useEffect(() => {
    setDiagnosis(appointment.medicalRecord?.diagnosis ?? "")
    setRecordNotes(appointment.medicalRecord?.notes ?? "")
    setPlanDescription(appointment.medicalRecord?.planDescription ?? "")
    setTargetSessions(appointment.medicalRecord?.targetSessions ?? "")
    setServiceId(clinicalServices[0]?.id ?? "")
    setQuantity(1)
    setTreatmentNotes("")
    setMedicationName("")
    setDosage("")
    setFrequency("")
    setDuration("")
    setInstruction("")
    setActiveStep(null)
    setImageRows([createImageRow()])
  }, [appointment, clinicalServices])

  function openStep(step: ActiveStep) {
    setActiveStep(step)
  }

  function goPrevious() {
    setActiveStep((current) => (current && current > 1 ? ((current - 1) as ActiveStep) : current))
  }

  function goNext() {
    setActiveStep((current) => (current && current < 4 ? ((current + 1) as ActiveStep) : current))
  }

  function handleCreatePrescription() {
    onCreatePrescription({ medicationName, dosage, frequency, duration, instruction })
    setMedicationName("")
    setDosage("")
    setFrequency("")
    setDuration("")
    setInstruction("")
  }

  function updateImageRow(id: string, patch: Partial<Omit<PendingSkinImage, "id">>) {
    setImageRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function addImageRow() {
    setImageRows((current) => [...current, createImageRow()])
  }

  function removeImageRow(id: string) {
    setImageRows((current) =>
      current.length === 1 ? [createImageRow()] : current.filter((row) => row.id !== id),
    )
  }

  function handleUploadSkinImages() {
    const rowsWithFiles = imageRows.filter((row) => row.file)
    if (rowsWithFiles.length === 0) return

    rowsWithFiles.forEach((row) => {
      if (!row.file) return
      const formData = new FormData()
      formData.set("file", row.file)
      if (row.bodyArea.trim()) formData.set("bodyArea", row.bodyArea.trim())
      if (row.note.trim()) formData.set("note", row.note.trim())
      onUploadSkinImage(formData)
    })
    setImageRows([createImageRow()])
  }

  return (
    <div className="rounded-2xl border border-primary-light bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex justify-end">
        <span className="w-fit rounded-full bg-hairline-soft px-3 py-1 text-xs font-semibold text-muted">
          {canEditClinical ? (visitStarted ? "Đang khám" : "Draft") : "Chưa mở khóa"}
        </span>
      </div>

      {!appointment.medicalRecord ? (
        <div className="mt-3 text-sm text-muted">Cần xác nhận cọc để tạo hồ sơ bệnh án trước.</div>
      ) : !canEditClinical ? (
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          {appointment.status !== "CONFIRMED" && appointment.status !== "CHECKED_IN"
            ? "Ca chưa ở trạng thái có thể ghi hồ sơ."
            : "Ca đã khóa hoặc không thể sửa y lệnh."}
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((item) => (
              <StepCard key={item.step} item={item} onOpen={() => openStep(item.step)} />
            ))}
          </div>

          <Dialog open={activeStep !== null} onOpenChange={(open) => !open && setActiveStep(null)}>
            <DialogContent className="max-h-[86vh] overflow-y-auto rounded-3xl border-hairline-muted p-0 sm:max-w-2xl">
              {activeMeta && (
                <>
                  <div className="border-b border-hairline-muted px-5 py-4">
                    <DialogHeader className="space-y-2 text-left">
                      <div className="flex items-center gap-3 pr-8">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                          {activeMeta.step}
                        </span>
                        <div>
                          <DialogTitle className="text-lg font-bold text-ink">
                            {activeMeta.title}
                          </DialogTitle>
                          <DialogDescription className="text-sm text-muted">
                            {activeMeta.description}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                  </div>

                  <div className="px-5 py-5">
                    {activeStep === 1 && (
                      <RecordStep
                        diagnosis={diagnosis}
                        recordNotes={recordNotes}
                        planDescription={planDescription}
                        targetSessions={targetSessions}
                        isPending={isPending}
                        onDiagnosisChange={setDiagnosis}
                        onRecordNotesChange={setRecordNotes}
                        onPlanDescriptionChange={setPlanDescription}
                        onTargetSessionsChange={setTargetSessions}
                        onSave={() =>
                          onSaveRecord(
                            diagnosis,
                            recordNotes,
                            planDescription,
                            targetSessions === "" ? null : targetSessions,
                          )
                        }
                      />
                    )}
                    {activeStep === 2 && (
                      <ServiceStep
                        clinicalServices={clinicalServices}
                        serviceId={serviceId}
                        quantity={quantity}
                        treatmentNotes={treatmentNotes}
                        isPending={isPending}
                        onServiceIdChange={setServiceId}
                        onQuantityChange={setQuantity}
                        onTreatmentNotesChange={setTreatmentNotes}
                        onAdd={() => onAddTreatment(serviceId, quantity, treatmentNotes)}
                      />
                    )}
                    {activeStep === 3 && (
                      <PrescriptionStep
                        medicationName={medicationName}
                        dosage={dosage}
                        frequency={frequency}
                        duration={duration}
                        instruction={instruction}
                        isPending={isPending}
                        onMedicationNameChange={setMedicationName}
                        onDosageChange={setDosage}
                        onFrequencyChange={setFrequency}
                        onDurationChange={setDuration}
                        onInstructionChange={setInstruction}
                        onCreate={handleCreatePrescription}
                      />
                    )}
                    {activeStep === 4 && (
                      <SkinImagesStep
                        imageRows={imageRows}
                        isPending={isPending}
                        onAddImage={addImageRow}
                        onRemoveImage={removeImageRow}
                        onUpdateImage={updateImageRow}
                        onUpload={handleUploadSkinImages}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-hairline-muted bg-surface-soft px-5 py-4">
                    <button
                      type="button"
                      onClick={goPrevious}
                      disabled={activeMeta.step === 1}
                      className="h-9 rounded-full border border-hairline bg-white px-4 text-sm font-semibold text-muted transition hover:bg-hairline-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={activeMeta.step === 4}
                      className="h-9 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted-soft"
                    >
                      Bước tiếp
                    </button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

function StepCard({
  item,
  onOpen,
}: {
  item: { step: ActiveStep; title: string; description: string }
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-2xl border border-hairline bg-white p-4 text-left transition hover:border-primary-light hover:bg-blue-50"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
        {item.step}
      </span>
      <div className="mt-3 text-sm font-bold text-ink">{item.title}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted">{item.description}</div>
      <div className="mt-4 text-xs font-semibold text-primary">Mở bước</div>
    </button>
  )
}

function RecordStep({
  diagnosis,
  recordNotes,
  planDescription,
  targetSessions,
  isPending,
  onDiagnosisChange,
  onRecordNotesChange,
  onPlanDescriptionChange,
  onTargetSessionsChange,
  onSave,
}: {
  diagnosis: string
  recordNotes: string
  planDescription: string
  targetSessions: number | ""
  isPending: boolean
  onDiagnosisChange: (value: string) => void
  onRecordNotesChange: (value: string) => void
  onPlanDescriptionChange: (value: string) => void
  onTargetSessionsChange: (value: number | "") => void
  onSave: () => void
}) {
  return (
    <div className="grid gap-3">
      <label className="text-xs font-semibold uppercase text-muted">Chẩn đoán</label>
      <textarea
        value={diagnosis}
        onChange={(event) => onDiagnosisChange(event.target.value)}
        className="min-h-24 rounded-2xl border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        placeholder="Nhập chẩn đoán sau khi khám..."
      />
      <label className="text-xs font-semibold uppercase text-muted">Ghi chú</label>
      <textarea
        value={recordNotes}
        onChange={(event) => onRecordNotesChange(event.target.value)}
        className="min-h-24 rounded-2xl border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        placeholder="Ghi chú bệnh án..."
      />
      <label className="text-xs font-semibold uppercase text-muted">Phác đồ điều trị</label>
      <textarea
        value={planDescription}
        onChange={(event) => onPlanDescriptionChange(event.target.value)}
        className="min-h-20 rounded-2xl border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        placeholder="Mô tả phác đồ điều trị (nếu có)..."
      />
      <div className="flex items-center gap-3">
        <label className="whitespace-nowrap text-xs font-semibold uppercase text-muted">
          Tổng số buổi
        </label>
        <input
          type="number"
          min={1}
          value={targetSessions}
          onChange={(event) =>
            onTargetSessionsChange(
              event.target.value === "" ? "" : Math.max(1, Number(event.target.value)),
            )
          }
          className="h-9 w-24 rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
          placeholder="VD: 6"
        />
        <span className="text-xs text-muted">buổi</span>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        Lưu bệnh án
      </button>
    </div>
  )
}

function ServiceStep({
  clinicalServices,
  serviceId,
  quantity,
  treatmentNotes,
  isPending,
  onServiceIdChange,
  onQuantityChange,
  onTreatmentNotesChange,
  onAdd,
}: {
  clinicalServices: UiService[]
  serviceId: string
  quantity: number
  treatmentNotes: string
  isPending: boolean
  onServiceIdChange: (value: string) => void
  onQuantityChange: (value: number) => void
  onTreatmentNotesChange: (value: string) => void
  onAdd: () => void
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
        <select
          value={serviceId}
          onChange={(event) => onServiceIdChange(event.target.value)}
          className="h-10 rounded-full border border-hairline bg-white px-3 text-sm text-ink outline-none focus:border-primary"
        >
          {clinicalServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - {formatVND(service.price)}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => onQuantityChange(Math.max(1, Number(event.target.value) || 1))}
          className="h-10 rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
      <input
        value={treatmentNotes}
        onChange={(event) => onTreatmentNotesChange(event.target.value)}
        className="h-10 w-full rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
        placeholder="Ghi chú y lệnh..."
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={isPending || !serviceId}
        className="h-10 rounded-full border border-primary px-4 text-sm font-semibold text-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Thêm y lệnh
      </button>
    </div>
  )
}

function PrescriptionStep({
  medicationName,
  dosage,
  frequency,
  duration,
  instruction,
  isPending,
  onMedicationNameChange,
  onDosageChange,
  onFrequencyChange,
  onDurationChange,
  onInstructionChange,
  onCreate,
}: {
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instruction: string
  isPending: boolean
  onMedicationNameChange: (value: string) => void
  onDosageChange: (value: string) => void
  onFrequencyChange: (value: string) => void
  onDurationChange: (value: string) => void
  onInstructionChange: (value: string) => void
  onCreate: () => void
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={medicationName}
          onChange={(event) => onMedicationNameChange(event.target.value)}
          className="h-10 rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
          placeholder="Tên thuốc"
        />
        <input
          value={dosage}
          onChange={(event) => onDosageChange(event.target.value)}
          className="h-10 rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
          placeholder="Liều lượng, VD: 500mg"
        />
        <input
          value={frequency}
          onChange={(event) => onFrequencyChange(event.target.value)}
          className="h-10 rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
          placeholder="Tần suất, VD: 2 lần/ngày"
        />
        <input
          value={duration}
          onChange={(event) => onDurationChange(event.target.value)}
          className="h-10 rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
          placeholder="Thời gian, VD: 7 ngày"
        />
      </div>
      <input
        value={instruction}
        onChange={(event) => onInstructionChange(event.target.value)}
        className="h-10 w-full rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
        placeholder="Hướng dẫn dùng thuốc..."
      />
      <button
        type="button"
        onClick={onCreate}
        disabled={
          isPending ||
          !medicationName.trim() ||
          !dosage.trim() ||
          !frequency.trim() ||
          !duration.trim()
        }
        className="h-10 rounded-full border border-primary px-4 text-sm font-semibold text-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Thêm thuốc
      </button>
    </div>
  )
}

function SkinImagesStep({
  imageRows,
  isPending,
  onAddImage,
  onRemoveImage,
  onUpdateImage,
  onUpload,
}: {
  imageRows: PendingSkinImage[]
  isPending: boolean
  onAddImage: () => void
  onRemoveImage: (id: string) => void
  onUpdateImage: (id: string, patch: Partial<Omit<PendingSkinImage, "id">>) => void
  onUpload: () => void
}) {
  const fileCount = imageRows.filter((row) => row.file).length
  return (
    <div className="grid gap-3">
      {imageRows.map((row, index) => (
        <div key={row.id} className="rounded-2xl border border-hairline bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase text-muted">Ảnh {index + 1}</div>
            <button
              type="button"
              onClick={() => onRemoveImage(row.id)}
              className="rounded-full border border-hairline px-3 py-1 text-xs font-semibold text-muted transition hover:bg-hairline-soft"
            >
              Bỏ ảnh
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => onUpdateImage(row.id, { file: event.target.files?.[0] ?? null })}
              className="h-10 rounded-full border border-hairline px-3 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-hairline-soft file:px-3 file:text-xs file:font-semibold file:text-muted"
            />
            <input
              value={row.bodyArea}
              onChange={(event) => onUpdateImage(row.id, { bodyArea: event.target.value })}
              className="h-10 rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
              placeholder="Vùng da, VD: mặt, lưng..."
            />
          </div>
          <input
            value={row.note}
            onChange={(event) => onUpdateImage(row.id, { note: event.target.value })}
            className="mt-3 h-10 w-full rounded-full border border-hairline px-3 text-sm text-ink outline-none focus:border-primary"
            placeholder="Ghi chú ảnh..."
          />
          {row.file && (
            <p className="mt-2 text-xs font-semibold text-muted">Đã chọn: {row.file.name}</p>
          )}
        </div>
      ))}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onAddImage}
          className="h-10 rounded-full border border-hairline px-4 text-sm font-semibold text-ink transition hover:bg-hairline-soft"
        >
          Thêm ảnh
        </button>
        <button
          type="button"
          onClick={onUpload}
          disabled={isPending || fileCount === 0}
          className="h-10 rounded-full border border-primary px-4 text-sm font-semibold text-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Tải {fileCount || ""} ảnh da
        </button>
      </div>
    </div>
  )
}
