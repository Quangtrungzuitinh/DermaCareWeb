"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { usePaymentCountdown } from "@/hooks/usePaymentCountdown"
import { usePaymentPolling } from "@/hooks/usePaymentPolling"
import {
  PAYMENT_METHOD_META,
  PaymentConfirmedState,
  PaymentExpiredState,
  PaymentPendingState,
  type PaymentAppointment,
  type PaymentMethod,
} from "@/components/booking/PaymentPagePanels"

export function PaymentPageClient({
  appointment,
  selectPath,
}: {
  appointment: PaymentAppointment
  selectPath: string
}) {
  const router = useRouter()
  const { minutes, seconds, remaining, isExpired } = usePaymentCountdown(appointment.createdAt)
  const { data } = usePaymentPolling(appointment.id, appointment.status)

  const [showExpired, setShowExpired] = useState(false)
  const [method] = useState<PaymentMethod>(() => {
    try {
      const stored = sessionStorage.getItem(
        `paymentMethod:${appointment.id}`,
      ) as PaymentMethod | null
      if (stored && PAYMENT_METHOD_META[stored]) return stored
    } catch {}
    return "sepay"
  })

  const status = data?.status || appointment.status

  useEffect(() => {
    if (!isExpired || status === "CONFIRMED") return
    const grace = setTimeout(() => setShowExpired(true), 2 * 60_000)
    return () => clearTimeout(grace)
  }, [isExpired, status])

  useEffect(() => {
    if (status !== "CONFIRMED") return
    const t = setTimeout(() => {
      router.push(`/booking/success?id=${appointment.id}`)
    }, 2000)
    return () => clearTimeout(t)
  }, [appointment.id, router, status])

  function copy(value: string) {
    navigator.clipboard.writeText(value)
  }

  if (status === "CONFIRMED") {
    return <PaymentConfirmedState />
  }

  if (isExpired && showExpired) {
    return (
      <PaymentExpiredState
        onRetry={() => window.location.reload()}
        onSelectAnotherSlot={() => router.push(selectPath)}
      />
    )
  }

  return (
    <PaymentPendingState
      appointment={appointment}
      method={method}
      minutes={minutes}
      seconds={seconds}
      remaining={remaining}
      onCopy={copy}
    />
  )
}
