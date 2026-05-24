import type { AppointmentStatus, PaymentStatus } from "@/lib/generated/prisma"

export type PatientDashboardProfile = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  avatarUrl: string | null
}

export type PatientDashboardAppointment = {
  id: string
  appointmentDate: string
  durationMin: number | null
  status: AppointmentStatus
  baseFee: number
  notes: string | null
  doctor: {
    id: string
    fullName: string
    specialty: string | null
  }
}

export type PatientDashboardData = {
  profile: PatientDashboardProfile
  stats: {
    totalAppointments: number
    upcomingAppointments: number
    completedAppointments: number
    frequentlyVisitedDoctor: {
      id: string
      name: string
      specialty: string | null
      count: number
    } | null
  }
  monthlyCounts: Array<{
    label: string
    monthKey: string
    count: number
    isCurrent: boolean
  }>
  upcomingAppointments: PatientDashboardAppointment[]
  historyRows: PatientDashboardAppointment[]
  healthTip: {
    label: string
    title: string
  }
  generatedAt: string
}

export type PatientAppointment = {
  id: string
  appointmentDate: string
  durationMin: number
  status: AppointmentStatus
  baseFee: number
  notes: string | null
  paymentStatus: PaymentStatus | "UNPAID"
  paymentId: string | null
  doctor: {
    id: string
    fullName: string
    specialty: string | null
  }
  services: Array<{
    id: string
    name: string
    quantity: number
    priceAtTime: number
    notes: string | null
  }>
  medicalRecord: {
    id: string
    diagnosis: string | null
    notes: string | null
    planDescription: string | null
    targetSessions: number | null
    completedSessions: number
  } | null
}

export type PatientHealthSummary = {
  profile: PatientDashboardProfile
  totalVisits: number
  latestVisit: string | null
  activePrescriptions: number
  documentCount: number
  latestRecord: PatientMedicalRecord | null
}

export type PatientMedicalRecord = {
  id: string
  createdAt: string
  diagnosis: string | null
  notes: string | null
  visitReason: string | null
  planDescription: string | null
  targetSessions: number | null
  completedSessions: number
  appointment: {
    id: string
    appointmentDate: string
    status: AppointmentStatus
    doctor: {
      id: string
      fullName: string
      specialty: string | null
    }
  } | null
  skinImages: PatientSkinImage[]
  treatments: PatientTreatment[]
  prescriptions: PatientPrescription[]
}

export type PatientSkinImage = {
  id: string
  fileName: string
  thumbnailUrl: string | null
  bodyArea: string | null
  capturedAt: string
  note: string | null
}

export type PatientTreatment = {
  id: string
  medicalRecordId: string
  serviceName: string
  instruction: string | null
  quantity: number
  priceAtTime: number
  createdAt: string
}

export type PatientPrescription = {
  id: string
  medicalRecordId: string
  note: string | null
  createdAt: string
  status: "ACTIVE" | "ENDED"
  doctor: {
    id: string
    fullName: string
    specialty: string | null
  } | null
  items: Array<{
    id: string
    medicationName: string
    dosage: string
    frequency: string
    duration: string
    instruction: string | null
  }>
}

export type PatientMedicalDocument = {
  id: string
  title: string
  type: string
  url: string
  createdAt: string
}

export type { PatientProgressSummary } from "@/services/skin-analysis.service"

export type TimelineEventType =
  | "APPOINTMENT"
  | "ENCOUNTER"
  | "MEDICAL_RECORD"
  | "PRESCRIPTION"
  | "SKIN_IMAGE"
  | "TREATMENT_PLAN_STEP"
  | "FOLLOW_UP_NOTE"

export type TimelineEvent = {
  id: string
  type: TimelineEventType
  date: string
  title: string
  summary: string
  meta: Record<string, unknown>
}
