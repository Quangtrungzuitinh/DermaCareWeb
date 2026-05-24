"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { manualConfirmPayment } from "@/lib/actions/payment.actions"
import { cancelAppointment } from "@/lib/actions/appointment.actions"
import { notifyWaitlistForSlot } from "@/lib/actions/waitlist.actions"
import type { UiAppointment } from "@/services/clinic.types"

export function usePaymentActions(
  appointment: UiAppointment | null,
  onOpenChange: (open: boolean) => void,
) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [waitlistPrompt, setWaitlistPrompt] = useState(false)
  const [cancelledId, setCancelledId] = useState<string | null>(null)

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

  const handleConfirmPayment = () => {
    if (!appointment) return
    dispatch(async () => {
      await manualConfirmPayment(appointment.id, appointment.baseFee)
      onOpenChange(false)
      router.refresh()
    }, "Không thể xác nhận thanh toán.")
  }

  const handleCancelAppointment = () => {
    if (!appointment) return
    dispatch(async () => {
      await cancelAppointment(appointment.id, cancelReason)
      setRejectConfirmOpen(false)
      setCancelledId(appointment.id)
      setWaitlistPrompt(true)
      router.refresh()
    }, "Không thể hủy lịch hẹn.")
  }

  const handleNotifyWaitlist = () => {
    if (!cancelledId) return
    dispatch(async () => {
      await notifyWaitlistForSlot(cancelledId)
      setWaitlistPrompt(false)
      onOpenChange(false)
    }, "Không có ai trong hàng chờ.")
  }

  return {
    isPending,
    error,
    rejectConfirmOpen,
    setRejectConfirmOpen,
    cancelReason,
    setCancelReason,
    waitlistPrompt,
    setWaitlistPrompt,
    handleConfirmPayment,
    handleCancelAppointment,
    handleNotifyWaitlist,
  }
}
