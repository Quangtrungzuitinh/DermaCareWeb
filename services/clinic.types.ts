import type {
  ApprovalStatus,
  AppointmentStatus,
  ConfirmationSource,
  DayOfWeek,
  DoctorLevel,
  MedicalRecordStatus,
  NotificationType,
  PaymentStatus,
  Role,
  WaitlistStatus,
} from "@/lib/generated/prisma"

export type UiProfile = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  avatarUrl: string | null
  role: Role
  birthYear: number | null
  province: string | null
  district: string | null
  createdAt: string
}

export type UiDoctor = {
  id: string
  profileId: string
  fullName: string
  email: string | null
  phone: string | null
  licenseNumber: string
  seniorityLevel: DoctorLevel
  specialty: string | null
  isActive: boolean
  approvalStatus: ApprovalStatus
}

export type UiService = {
  id: string
  name: string
  price: number
  description: string | null
  durationMinutes: number
  isActive: boolean
  bookingCount30d?: number
}

export type UiTreatment = {
  id: string
  serviceId: string
  serviceName: string
  quantity: number
  priceAtTime: number
  notes: string | null
}

export type UiPrescriptionItem = {
  id: string
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instruction: string | null
}

export type UiPrescription = {
  id: string
  note: string | null
  createdAt: string
  items: UiPrescriptionItem[]
}

export type UiSkinImage = {
  id: string
  fileName: string
  mimeType: string
  thumbnailUrl: string | null
  bodyArea: string | null
  capturedAt: string
  note: string | null
}

export type UiMedicalRecord = {
  id: string
  encounterId: string | null
  status: MedicalRecordStatus
  diagnosis: string | null
  notes: string | null
  guestSnapshotName: string | null
  guestSnapshotPhone: string | null
  planDescription: string | null
  targetSessions: number | null
  completedSessions: number
  prescriptions: UiPrescription[]
  skinImages: UiSkinImage[]
  treatments: UiTreatment[]
}

export type UiPayment = {
  id: string
  amount: number
  status: PaymentStatus
  confirmationSource: ConfirmationSource
  confirmedAt: string | null
  confirmedByName: string | null
}

export type UiAppointment = {
  id: string
  status: AppointmentStatus
  appointmentDate: string
  durationMin: number
  baseFee: number
  notes: string | null
  visitReason: string | null
  payAtClinic: boolean
  guestName: string | null
  guestPhone: string | null
  guestEmail: string | null
  patient: UiProfile | null
  doctor: UiDoctor
  payment: UiPayment | null
  medicalRecord: UiMedicalRecord | null
  aiPredictedCondition: string | null
  aiConfidenceScore: number | null
}

export type UiScheduleRule = {
  id: string
  doctorId: string
  dayOfWeek: DayOfWeek
  startMinute: number
  endMinute: number
  slotDuration: number
  maxPatients: number
  isActive: boolean
}

export type UiWaitlistEntry = {
  id: string
  status: WaitlistStatus
  serviceName: string
  servicePrice: number
  preferredDoctorName: string | null
  notes: string | null
  notifiedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export type UiBlockedSlot = {
  id: string
  doctorId: string
  blockedDate: string
  startMinute: number
  endMinute: number
  reason: string | null
  isActive: boolean
}

export type UiNotification = {
  id: string
  type: NotificationType
  title: string
  body: string
  href: string | null
  rejectReason: string | null
  recipientId: string
  recipientName: string
  recipientRole: Role
  senderId: string | null
  senderName: string | null
  appointmentId: string | null
  isRead: boolean
  readAt: string | null
  revokedAt: string | null
  createdAt: string
}
