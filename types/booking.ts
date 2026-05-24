export type BookingMode = "doctor" | "service"

export type SlotItem = {
  label: string // "08:00 - 08:30"
  startMinute: number // GMT+7 minutes
  endMinute: number
  available: boolean
}

export type ConfirmDoctor = {
  id: string
  fullName: string
  specialty: string | null
}

export type ConfirmService = {
  id: string
  name: string
  price: number
} | null

export type ConfirmProfile = {
  fullName: string
  email: string | null
  phone: string | null
} | null

export type PaymentMethod = "vietqr" | "momo" | "zalopay"
