"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createAppointment } from "@/lib/actions/appointment.actions"
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants"

type ConfirmProfile = {
  fullName: string
  email: string | null
  phone: string | null
} | null

type GuestInfo = {
  guestName?: string
  guestPhone?: string
  guestEmail?: string
}

type PaymentMethod = "vietqr" | "momo" | "zalopay"

type Options = {
  profile: ConfirmProfile
  doctorId: string
  date: string
  slot: string
  note: string
  paymentBasePath: string
}

export function useBookingConfirmState({
  profile,
  doctorId,
  date,
  slot,
  note,
  paymentBasePath,
}: Options) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState({
    agreed: false,
    editing: false,
    paymentMethod: "vietqr" as PaymentMethod,
  })
  const [patientFields, setPatientFields] = useState({
    name: profile?.fullName ?? "",
    phone: profile?.phone ?? "",
    email: profile?.email ?? "",
  })

  useEffect(() => {
    if (profile) return
    try {
      const stored = sessionStorage.getItem("guestInfo")
      if (!stored) return
      const guest = JSON.parse(stored) as GuestInfo
      setPatientFields({
        name: guest.guestName ?? "",
        phone: guest.guestPhone ?? "",
        email: guest.guestEmail ?? "",
      })
    } catch {}
  }, [profile])

  const canConfirm =
    confirmState.agreed &&
    !confirmState.editing &&
    patientFields.name.trim() !== "" &&
    patientFields.phone.trim() !== ""

  function handleConfirm() {
    if (!canConfirm) return
    setError(null)
    startTransition(async () => {
      try {
        const appointmentDate = buildAppointmentDate(date, slot)

        let aiPredictedCondition: string | undefined
        let aiConfidenceScore: number | undefined
        try {
          const aiRaw = sessionStorage.getItem("ai_skin")
          if (aiRaw) {
            const aiData = JSON.parse(aiRaw) as { condition?: string; confidence?: number }
            aiPredictedCondition = aiData.condition ?? undefined
            aiConfidenceScore = aiData.confidence ?? undefined
          }
        } catch {}

        const result = await createAppointment({
          doctorId,
          appointmentDate,
          guestName: profile ? undefined : patientFields.name.trim(),
          guestPhone: profile ? undefined : patientFields.phone.trim(),
          guestEmail: profile ? undefined : patientFields.email.trim() || undefined,
          visitReason: note || undefined,
          notes: note || undefined,
          consentDataStorage: confirmState.agreed,
          aiPredictedCondition,
          aiConfidenceScore,
        })

        if (result?.success && result.appointment) {
          try {
            sessionStorage.removeItem("ai_skin")
            sessionStorage.setItem(
              `paymentMethod:${result.appointment.id}`,
              confirmState.paymentMethod,
            )
          } catch {}
          router.push(`${paymentBasePath}/${result.appointment.id}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tạo lịch hẹn."
        if (message.includes("SLOT_TAKEN"))
          setError("Ca khám vừa được đặt. Vui lòng chọn giờ khác.")
        else if (message.includes("GUEST_MISSING_INFO"))
          setError("Vui lòng nhập họ tên và số điện thoại.")
        else if (message.includes("CONSENT_REQUIRED"))
          setError("Vui lòng đồng ý lưu trữ hồ sơ y tế để hoàn tất đặt lịch.")
        else setError(message)
      }
    })
  }

  return {
    agreed: confirmState.agreed,
    setAgreed: (agreed: boolean) => setConfirmState((current) => ({ ...current, agreed })),
    editing: confirmState.editing,
    setEditing: (editing: boolean) => setConfirmState((current) => ({ ...current, editing })),
    paymentMethod: confirmState.paymentMethod,
    setPaymentMethod: (paymentMethod: PaymentMethod) =>
      setConfirmState((current) => ({ ...current, paymentMethod })),
    error,
    patientName: patientFields.name,
    setPatientName: (name: string) => setPatientFields((current) => ({ ...current, name })),
    patientPhone: patientFields.phone,
    setPatientPhone: (phone: string) => setPatientFields((current) => ({ ...current, phone })),
    patientEmail: patientFields.email,
    setPatientEmail: (email: string) => setPatientFields((current) => ({ ...current, email })),
    canConfirm,
    isPending,
    handleConfirm,
    deposit: APPOINTMENT_DEPOSIT_AMOUNT,
  }
}

function buildAppointmentDate(date: string, slot: string) {
  const start = (slot.split(/[–-]/)[0] ?? "").trim()
  const [hours = 0, minutes = 0] = start.split(":").map(Number)
  return new Date(
    `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+07:00`,
  )
}
