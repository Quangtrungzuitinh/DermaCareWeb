import { Suspense } from "react"
import { BookingSelectClient } from "@/components/booking/BookingSelectClient"
import { fetchBookingSelectData } from "@/lib/booking-data"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function BookingSelectPage() {
  const { linkedDoctors, services, patient } = await fetchBookingSelectData()
  return (
    <Suspense fallback={null}>
      <BookingSelectClient
        doctors={linkedDoctors}
        services={services}
        patient={patient}
        selectBasePath="/booking/select"
        confirmBasePath="/booking/confirm"
      />
    </Suspense>
  )
}
