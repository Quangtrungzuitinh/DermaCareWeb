"use client"

import { BookingLayout } from "@/components/booking/BookingLayout"
import {
  BookingSelectLeftColumn,
  BookingSelectOptionsPanel,
} from "@/components/booking/BookingSelectPanels"
import { BookingSelectSummary } from "@/components/booking/BookingSelectSummary"
import {
  type DoctorWithProfile,
  type PatientSummary,
} from "@/components/booking/BookingSelectUtils"
import { useBookingSelectState } from "@/components/booking/useBookingSelectState"
import type { Service } from "@/lib/generated/prisma"

export function BookingSelectClient({
  doctors,
  services,
  patient,
  selectBasePath,
  confirmBasePath,
}: {
  doctors: DoctorWithProfile[]
  services: Service[]
  patient: PatientSummary
  selectBasePath: string
  confirmBasePath: string
}) {
  const booking = useBookingSelectState({ doctors, services, selectBasePath, confirmBasePath })

  return (
    <BookingLayout current={1}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[360px_1fr_300px]">
        <BookingSelectLeftColumn booking={booking} patient={patient} />
        <BookingSelectOptionsPanel booking={booking} />
        <BookingSelectSummary booking={booking} />
      </div>
    </BookingLayout>
  )
}
