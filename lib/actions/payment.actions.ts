"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { AppointmentStatus, ConfirmationSource, PaymentStatus } from "@/lib/generated/prisma"
import { notifyPaymentConfirmed } from "@/services/notification.service"
import { revalidatePath } from "next/cache"

interface ConfirmPaymentParams {
  appointmentId?: string
  partialAppointmentId?: string
  confirmedById: string | null
  amount: number
  source: ConfirmationSource
}

export async function confirmPayment({
  appointmentId,
  partialAppointmentId,
  confirmedById,
  amount,
  source,
}: ConfirmPaymentParams) {
  const result = await prisma.$transaction(async (tx) => {
    let resolvedId: string

    if (partialAppointmentId) {
      const found = await tx.appointment.findFirst({
        where: { id: { endsWith: partialAppointmentId } },
        select: { id: true },
      })
      if (!found) throw new Error("APPOINTMENT_NOT_FOUND")
      resolvedId = found.id
    } else if (appointmentId) {
      resolvedId = appointmentId
    } else {
      throw new Error("Must provide appointmentId or partialAppointmentId")
    }

    const appointment = await tx.appointment.findUnique({
      where: { id: resolvedId },
    })

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND")

    if (appointment.status === AppointmentStatus.CONFIRMED) {
      return { success: true, idempotent: true, appointmentId: resolvedId }
    }

    if (appointment.status !== AppointmentStatus.PENDING_PAYMENT) {
      throw new Error(`INVALID_STATUS:${appointment.status}`)
    }

    if (amount < appointment.baseFee) {
      throw new Error(`INSUFFICIENT_AMOUNT:expected=${appointment.baseFee},got=${amount}`)
    }

    const payment = await tx.payment.create({
      data: {
        appointmentId: resolvedId,
        amount,
        status: PaymentStatus.CONFIRMED,
        confirmationSource: source,
        payerId: appointment.patientId ?? null,
        confirmedById,
        confirmedAt: new Date(),
      },
    })

    await tx.appointment.update({
      where: { id: resolvedId },
      data: { status: AppointmentStatus.CONFIRMED },
    })

    const medicalRecord = await tx.medicalRecord.create({
      data: {
        appointmentId: resolvedId,
        patientId: appointment.patientId ?? null,
        doctorId: appointment.doctorId,
        chiefComplaint: appointment.visitReason ?? appointment.notes ?? null,
        guestSnapshotName: appointment.patientId ? null : appointment.guestName,
        guestSnapshotPhone: appointment.patientId ? null : appointment.guestPhone,
      },
    })

    return { success: true, payment, medicalRecord, idempotent: false, appointmentId: resolvedId }
  })

  if (!result.idempotent) {
    await notifyPaymentConfirmed(result.appointmentId)
  }

  return result
}

export async function manualConfirmPayment(appointmentId: string, amount: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("UNAUTHORIZED")

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!profile || !["STAFF", "ADMIN"].includes(profile.role)) {
    throw new Error("FORBIDDEN: only STAFF or ADMIN can confirm payments")
  }

  const result = await confirmPayment({
    appointmentId,
    confirmedById: profile.id,
    amount,
    source: ConfirmationSource.MANUAL,
  })

  revalidatePath("/staff")
  revalidatePath("/staff/appointments")
  revalidatePath("/admin")
  revalidatePath("/patient")
  return result
}
