"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { AiPredictionPanel } from "@/components/shared/AiPredictionPanel"
import { Initials } from "@/components/shared/InitialsAvatar"
import { ClinicalEditPanel } from "@/components/shared/appointments/ClinicalEditPanel"
import { AppointmentActionsSidebar } from "@/components/shared/appointments/AppointmentActionsSidebar"
import { DEFAULT_SLOT_DURATION_MIN } from "@/lib/constants"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import { usePaymentActions } from "@/hooks/usePaymentActions"
import { useClinicalActions } from "@/hooks/useClinicalActions"
import { useGuestLinkActions } from "@/hooks/useGuestLinkActions"
import type { UiAppointment, UiService } from "@/services/clinic.types"
import { AppointmentStatus } from "@/lib/generated/prisma"

export function AppointmentDetailDialog({
  appointment,
  onOpenChange,
  allowActions = true,
  allowClinicalActions = false,
  allowPresenceConfirmation = false,
  clinicalServices = [],
}: {
  appointment: UiAppointment | null
  onOpenChange: (open: boolean) => void
  allowActions?: boolean
  allowClinicalActions?: boolean
  allowPresenceConfirmation?: boolean
  clinicalServices?: UiService[]
}) {
  const paymentActions = usePaymentActions(appointment, onOpenChange)
  const clinicalActions = useClinicalActions(appointment, onOpenChange)
  const guestActions = useGuestLinkActions(appointment)

  const patientName = appointment?.patient?.fullName ?? appointment?.guestName ?? "Khách vãng lai"
  const phone = appointment?.guestPhone ?? appointment?.patient?.phone ?? "Chưa có SĐT"
  const email = appointment?.guestEmail ?? appointment?.patient?.email ?? "Chưa có email"
  const treatments = appointment?.medicalRecord?.treatments ?? []
  const prescriptions = appointment?.medicalRecord?.prescriptions ?? []
  const treatmentTotal = treatments.reduce((sum, t) => sum + t.priceAtTime * t.quantity, 0)
  const visitStarted = appointment
    ? new Date(appointment.appointmentDate).getTime() <= Date.now()
    : false
  const canEditClinical =
    allowClinicalActions &&
    Boolean(appointment?.medicalRecord) &&
    appointment?.status === AppointmentStatus.CHECKED_IN
  const canConfirmPresence =
    allowPresenceConfirmation &&
    allowClinicalActions &&
    appointment?.status === AppointmentStatus.CONFIRMED
  const canConfirm = allowActions && appointment?.status === AppointmentStatus.PENDING_PAYMENT
  const canReject =
    allowActions &&
    (appointment?.status === AppointmentStatus.PENDING_PAYMENT ||
      appointment?.status === AppointmentStatus.CONFIRMED ||
      appointment?.status === AppointmentStatus.CHECKED_IN)
  const canLinkGuest = allowActions && Boolean(appointment) && !appointment?.patient

  return (
    <Dialog open={Boolean(appointment)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-hairline-muted p-0 sm:max-w-3xl">
        {appointment && (
          <>
            <div className="border-b border-hairline-muted px-6 py-5">
              <DialogHeader className="space-y-3 text-left">
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div className="flex min-w-0 items-start gap-3">
                    <Initials name={patientName} size={44} />
                    <div className="min-w-0">
                      <DialogTitle className="truncate text-xl font-bold text-ink">
                        {patientName}
                      </DialogTitle>
                      <DialogDescription className="text-muted">
                        {formatAppointmentDate(
                          appointment.appointmentDate,
                          "EEE, dd/MM/yyyy HH:mm",
                        )}
                      </DialogDescription>
                    </div>
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
              </DialogHeader>
            </div>

            <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1.4fr_1fr]">
              <section className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailInfo
                    label="Bác sĩ"
                    value={appointment.doctor.fullName}
                    sub={appointment.doctor.specialty ?? undefined}
                  />
                  <DetailInfo
                    label="Thời lượng"
                    value={`${appointment.durationMin ?? DEFAULT_SLOT_DURATION_MIN} phút`}
                  />
                  <DetailInfo label="Số điện thoại" value={phone} />
                  <DetailInfo label="Email" value={email} />
                </div>

                <div className="rounded-2xl bg-surface-soft p-4">
                  <div className="text-xs font-semibold uppercase text-muted">Lý do khám</div>
                  <div className="mt-2 text-sm text-ink">
                    {appointment.visitReason ?? appointment.notes ?? "Chưa ghi nhận"}
                  </div>
                </div>

                {allowClinicalActions && (
                  <AiPredictionPanel
                    aiPredictedCondition={appointment.aiPredictedCondition}
                  />
                )}

                <div className="rounded-2xl bg-surface-soft p-4">
                  <div className="text-xs font-semibold uppercase text-muted">Hồ sơ bệnh án</div>
                  {appointment.medicalRecord ? (
                    <div className="mt-3 space-y-3 text-sm text-body">
                      <div>Chẩn đoán: {appointment.medicalRecord.diagnosis ?? "Chưa cập nhật"}</div>
                      <div>Ghi chú: {appointment.medicalRecord.notes ?? "Chưa cập nhật"}</div>
                      {appointment.medicalRecord.targetSessions && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                          <div className="mb-2 text-xs font-semibold text-blue-800">
                            Kế hoạch điều trị —{" "}
                            {appointment.medicalRecord.completedSessions}/
                            {appointment.medicalRecord.targetSessions} buổi
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${Math.min(100, Math.round((appointment.medicalRecord.completedSessions / appointment.medicalRecord.targetSessions) * 100))}%`,
                              }}
                            />
                          </div>
                          {appointment.medicalRecord.planDescription && (
                            <p className="mt-2 text-xs text-blue-700">
                              {appointment.medicalRecord.planDescription}
                            </p>
                          )}
                          {allowActions && (
                            <button
                              type="button"
                              onClick={clinicalActions.handleIncrementSessions}
                              disabled={
                                clinicalActions.isPending ||
                                appointment.medicalRecord.completedSessions >=
                                  appointment.medicalRecord.targetSessions
                              }
                              className="mt-3 h-8 rounded-full bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Ghi nhận buổi
                            </button>
                          )}
                          {clinicalActions.error && (
                            <p className="mt-2 text-xs text-red-700">{clinicalActions.error}</p>
                          )}
                        </div>
                      )}
                      {treatments.length > 0 && (
                        <div className="space-y-2 border-t border-hairline pt-3">
                          {treatments.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3">
                              <span className="min-w-0 truncate">
                                {item.serviceName} x{item.quantity}
                              </span>
                              <span className="shrink-0 font-semibold">
                                {formatVND(item.priceAtTime * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {prescriptions.length > 0 && (
                        <div className="space-y-2 border-t border-hairline pt-3">
                          <div className="text-xs font-semibold uppercase text-muted">Đơn thuốc</div>
                          {prescriptions.flatMap((prescription) =>
                            prescription.items.map((item) => (
                              <div key={item.id} className="text-sm">
                                <div className="font-semibold text-ink">{item.medicationName}</div>
                                <div className="text-xs text-muted">
                                  {item.dosage} · {item.frequency} · {item.duration}
                                </div>
                              </div>
                            )),
                          )}
                        </div>
                      )}
                      {appointment.medicalRecord.skinImages.length > 0 && (
                        <div className="space-y-2 border-t border-hairline pt-3">
                          <div className="text-xs font-semibold uppercase text-muted">Ảnh da</div>
                          <div className="grid grid-cols-3 gap-2">
                            {appointment.medicalRecord.skinImages.map((image) => (
                              <a
                                key={image.id}
                                href={`/api/skin-images/${image.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="aspect-square overflow-hidden rounded-xl border border-hairline bg-surface-soft"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image.thumbnailUrl ?? `/api/skin-images/${image.id}`}
                                  alt={image.bodyArea ?? image.fileName}
                                  className="h-full w-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-muted">
                      Hồ sơ sẽ được tạo sau khi xác nhận cọc.
                    </div>
                  )}
                </div>

                {allowClinicalActions && (
                  <ClinicalEditPanel
                    appointment={appointment}
                    clinicalServices={clinicalServices}
                    canEditClinical={canEditClinical}
                    visitStarted={visitStarted}
                    isPending={clinicalActions.isPending}
                    onSaveRecord={clinicalActions.handleSaveRecord}
                    onAddTreatment={clinicalActions.handleAddTreatment}
                    onCreatePrescription={clinicalActions.handleCreatePrescription}
                    onUploadSkinImage={clinicalActions.handleUploadSkinImage}
                  />
                )}
              </section>

              <AppointmentActionsSidebar
                appointment={appointment}
                patientName={patientName}
                treatmentTotal={treatmentTotal}
                paymentActions={paymentActions}
                clinicalActions={clinicalActions}
                guestActions={guestActions}
                onOpenChange={onOpenChange}
                flags={{
                  canConfirmPresence: canConfirmPresence ?? false,
                  canConfirm: canConfirm ?? false,
                  canReject: canReject ?? false,
                  canLinkGuest: canLinkGuest ?? false,
                  canEditClinical: canEditClinical ?? false,
                  visitStarted,
                  allowClinicalActions,
                }}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DetailInfo({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-4">
      <div className="text-xs font-semibold uppercase text-muted">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-ink">{value}</div>
      {sub && <div className="mt-1 truncate text-xs text-muted">{sub}</div>}
    </div>
  )
}
