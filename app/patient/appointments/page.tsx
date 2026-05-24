import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { PatientShell } from "@/components/patient/PatientShell"
import { PatientProfileMissingState } from "@/components/patient/PatientProfileMissingState"
import { AppointmentsView } from "@/components/shared/AppointmentsView"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import type { PatientAppointment } from "@/services/patient.types"
import { appointmentService, PatientProfileNotFoundError } from "@/services/patient.service"
import type { UiAppointment, UiProfile } from "@/services/clinic.types"

async function getCurrentPatientProfile(): Promise<UiProfile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new PatientProfileNotFoundError()

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      birthYear: true,
      province: true,
      district: true,
      createdAt: true,
    },
  })

  if (!profile) throw new PatientProfileNotFoundError()

  return {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
  }
}

function toUiAppointment(appointment: PatientAppointment, patient: UiProfile): UiAppointment {
  return {
    id: appointment.id,
    status: appointment.status,
    appointmentDate: appointment.appointmentDate,
    durationMin: appointment.durationMin,
    baseFee: appointment.baseFee,
    notes: appointment.notes,
    visitReason: appointment.notes,
    payAtClinic: false,
    guestName: null,
    guestPhone: null,
    guestEmail: null,
    aiPredictedCondition: null,
    aiConfidenceScore: null,
    patient,
    doctor: {
      id: appointment.doctor.id,
      profileId: appointment.doctor.id,
      fullName: appointment.doctor.fullName,
      email: null,
      phone: null,
      licenseNumber: "",
      seniorityLevel: "JUNIOR",
      specialty: appointment.doctor.specialty,
      isActive: true,
      approvalStatus: "APPROVED",
    },
    payment:
      appointment.paymentId && appointment.paymentStatus !== "UNPAID"
        ? {
            id: appointment.paymentId,
            amount: appointment.baseFee,
            status: appointment.paymentStatus,
            confirmationSource: "WEBHOOK",
            confirmedAt: null,
            confirmedByName: null,
          }
        : null,
    medicalRecord: appointment.medicalRecord
      ? {
          id: appointment.medicalRecord.id,
          encounterId: null,
          status: "DRAFT",
          diagnosis: appointment.medicalRecord.diagnosis,
          notes: appointment.medicalRecord.notes,
          guestSnapshotName: null,
          guestSnapshotPhone: null,
          planDescription: null,
          targetSessions: null,
          completedSessions: 0,
          prescriptions: [],
          skinImages: [],
          treatments: appointment.services.map((service, index) => ({
            id: `${appointment.id}-${service.id}-${index}`,
            serviceId: service.id,
            serviceName: service.name,
            quantity: service.quantity,
            priceAtTime: service.priceAtTime,
            notes: service.notes,
          })),
        }
      : null,
  }
}

export default async function PatientAppointmentsPage() {
  try {
    const [appointments, profile] = await Promise.all([
      appointmentService.getMyAppointments(),
      getCurrentPatientProfile(),
    ])
    const uiAppointments = appointments.map((appointment) => toUiAppointment(appointment, profile))

    return (
      <PatientShell
        title="Lịch hẹn của tôi"
        description={`${uiAppointments.length} lịch hẹn tổng cộng`}
        profile={{ fullName: profile.fullName, email: profile.email }}
      >
        <Suspense>
          <AppointmentsView
            appointments={uiAppointments}
            detailBasePath="/patient/appointments"
            detailNavigation="dialog"
            allowDetailActions={false}
            actions={
              <Link
                href="/patient/booking/select"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" />
                Đặt lịch mới
              </Link>
            }
          />
        </Suspense>
      </PatientShell>
    )
  } catch (error) {
    if (error instanceof PatientProfileNotFoundError) {
      return <PatientProfileMissingState />
    }

    throw error
  }
}
