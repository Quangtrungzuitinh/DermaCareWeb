"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  addTreatment,
  completeAppointment,
  incrementCompletedSessions,
  updateMedicalRecord,
} from "@/lib/actions/treatment.actions"
import { createPrescription } from "@/lib/actions/prescription.actions"
import { uploadSkinImage } from "@/lib/actions/skin-image.actions"
import { doctorConfirmPatientPresent } from "@/lib/actions/encounter.actions"
import type { UiAppointment } from "@/services/clinic.types"

export function useClinicalActions(
  appointment: UiAppointment | null,
  onOpenChange: (open: boolean) => void,
) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function dispatch(action: () => Promise<void>, fallback: string) {
    setError("")
    startTransition(async () => {
      try {
        await action()
      } catch (err) {
        setError(err instanceof Error ? err.message : fallback)
      }
    })
  }

  const handleSaveRecord = (
    diagnosis: string,
    notes: string,
    planDescription: string,
    targetSessions: number | null,
  ) => {
    if (!appointment?.medicalRecord) return
    dispatch(async () => {
      await updateMedicalRecord(appointment.medicalRecord!.id, {
        diagnosis,
        notes,
        planDescription,
        targetSessions,
      })
      router.refresh()
    }, "Không thể cập nhật y lệnh.")
  }

  const handleIncrementSessions = () => {
    if (!appointment?.medicalRecord) return
    dispatch(async () => {
      await incrementCompletedSessions(appointment.medicalRecord!.id)
      router.refresh()
    }, "Không thể ghi nhận buổi.")
  }

  const handleAddTreatment = (serviceId: string, quantity: number, notes: string) => {
    if (!appointment?.medicalRecord) return
    dispatch(async () => {
      await addTreatment(appointment.medicalRecord!.id, serviceId, quantity, notes)
      router.refresh()
    }, "Không thể thêm y lệnh.")
  }

  const handleCreatePrescription = (item: {
    medicationName: string
    dosage: string
    frequency: string
    duration: string
    instruction: string
  }) => {
    if (!appointment?.medicalRecord) return
    dispatch(async () => {
      await createPrescription({ medicalRecordId: appointment.medicalRecord!.id, items: [item] })
      router.refresh()
    }, "Không thể thêm đơn thuốc.")
  }

  const handleUploadSkinImage = (formData: FormData) => {
    if (!appointment?.medicalRecord) return
    if (!appointment.patient) {
      setError("Cần nối khách vãng lai với tài khoản bệnh nhân trước khi lưu ảnh da.")
      return
    }
    formData.set("medicalRecordId", appointment.medicalRecord.id)
    setError("")
    startTransition(async () => {
      try {
        await uploadSkinImage(formData)
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải ảnh da."
        setError(
          message.includes("CONSENT_REQUIRED:STORE_SKIN_IMAGE")
            ? "Bệnh nhân chưa đồng ý lưu ảnh da. Hãy ghi nhận consent trước khi tải ảnh."
            : message,
        )
      }
    })
  }

  const handleComplete = () => {
    if (!appointment) return
    dispatch(async () => {
      await completeAppointment(appointment.id)
      onOpenChange(false)
      router.refresh()
    }, "Không thể hoàn thành ca khám.")
  }

  const handleConfirmPresence = () => {
    if (!appointment) return
    dispatch(async () => {
      await doctorConfirmPatientPresent(appointment.id)
      router.refresh()
    }, "Không thể xác nhận bệnh nhân có mặt.")
  }

  return {
    isPending,
    error,
    handleSaveRecord,
    handleIncrementSessions,
    handleAddTreatment,
    handleCreatePrescription,
    handleUploadSkinImage,
    handleComplete,
    handleConfirmPresence,
  }
}
