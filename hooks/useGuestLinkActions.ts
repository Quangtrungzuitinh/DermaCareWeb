"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { linkGuestAppointmentToPatient } from "@/lib/actions/appointment.actions"
import type { UiAppointment } from "@/services/clinic.types"

export function useGuestLinkActions(appointment: UiAppointment | null) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [guestIdentifier, setGuestIdentifier] = useState("")
  const [linkGuestMessage, setLinkGuestMessage] = useState("")

  const handleLinkGuest = () => {
    if (!appointment) return
    const value = (guestIdentifier || appointment.guestPhone || appointment.guestEmail || "").trim()
    if (!value) {
      setLinkGuestMessage("Nhập SĐT hoặc email của tài khoản bệnh nhân.")
      return
    }
    setLinkGuestMessage("")
    startTransition(async () => {
      try {
        await linkGuestAppointmentToPatient(appointment.id, value)
        setLinkGuestMessage("Đã nối khách vãng lai với hồ sơ bệnh nhân.")
        router.refresh()
      } catch (err) {
        setLinkGuestMessage(err instanceof Error ? err.message : "Không thể nối hồ sơ.")
      }
    })
  }

  return { isPending, guestIdentifier, setGuestIdentifier, linkGuestMessage, handleLinkGuest }
}
