'use server'

import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { AppointmentStatus, type Prisma } from '@/lib/generated/prisma'

const timelineInclude = {
  doctor: {
    include: {
      profile: {
        select: {
          fullName: true,
        },
      },
    },
  },
  medicalRecord: {
    include: {
      treatments: {
        include: {
          service: true,
        },
      },
    },
  },
} satisfies Prisma.AppointmentInclude

type TimelineAppointment = Prisma.AppointmentGetPayload<{
  include: typeof timelineInclude
}>

export type PatientTimelineStatus = Extract<
  AppointmentStatus,
  'COMPLETED' | 'CONFIRMED' | 'CHECKED_IN' | 'NO_SHOW'
>

export type PatientTimelineItem = {
  id: string
  appointmentDate: string
  status: PatientTimelineStatus
  doctor: {
    id: string
    fullName: string
    specialty: string | null
  }
  medicalRecord: {
    id: string
    diagnosis: string | null
    notes: string | null
    treatments: Array<{
      id: string
      quantity: number
      priceAtTime: number
      notes: string | null
      service: {
        id: string
        name: string
      }
    }>
  } | null
}

export type PatientTimelinePageData = {
  profile: {
    id: string
    fullName: string
    email: string | null
  }
  timeline: PatientTimelineItem[]
}

function serializeTimelineItem(appointment: TimelineAppointment): PatientTimelineItem {
  return {
    id: appointment.id,
    appointmentDate: appointment.appointmentDate.toISOString(),
    status: appointment.status as PatientTimelineStatus,
    doctor: {
      id: appointment.doctor.id,
      fullName: appointment.doctor.profile?.fullName ?? 'Bác sĩ đã ngừng hoạt động',
      specialty: appointment.doctor.specialty,
    },
    medicalRecord: appointment.medicalRecord
      ? {
          id: appointment.medicalRecord.id,
          diagnosis: appointment.medicalRecord.diagnosis,
          notes: appointment.medicalRecord.notes,
          treatments: appointment.medicalRecord.treatments.map((treatment) => ({
            id: treatment.id,
            quantity: treatment.quantity,
            priceAtTime: treatment.priceAtTime,
            notes: treatment.notes,
            service: {
              id: treatment.service.id,
              name: treatment.service.name,
            },
          })),
        }
      : null,
  }
}

async function getCurrentTimelinePatient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  })

  if (!profile) {
    throw new Error('PATIENT_PROFILE_NOT_FOUND')
  }

  return profile
}

export async function getPatientTimeline(): Promise<PatientTimelineItem[]> {
  const profile = await getCurrentTimelinePatient()

  return getTimelineForPatient(profile.id)
}

async function getTimelineForPatient(patientId: string): Promise<PatientTimelineItem[]> {
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId,
      status: {
        in: [
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.COMPLETED,
          AppointmentStatus.NO_SHOW,
        ],
      },
    },
    orderBy: { appointmentDate: 'desc' },
    include: timelineInclude,
  })

  return appointments.map(serializeTimelineItem)
}

export async function getPatientTimelinePageData(): Promise<PatientTimelinePageData> {
  const profile = await getCurrentTimelinePatient()
  const timeline = await getTimelineForPatient(profile.id)

  return { profile, timeline }
}
