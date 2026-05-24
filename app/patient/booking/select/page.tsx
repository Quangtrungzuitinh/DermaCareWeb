import { Suspense } from "react"
import { BookingSelectClient } from "@/components/booking/BookingSelectClient"
import { fetchBookingSelectData } from "@/lib/booking-data"

export default async function PatientBookingSelectPage() {
  const { linkedDoctors, services, patient } = await fetchBookingSelectData()
  return (
    <Suspense fallback={null}>
      <BookingSelectClient
        doctors={linkedDoctors}
        services={services}
        patient={patient}
        selectBasePath="/patient/booking/select"
        confirmBasePath="/patient/booking/confirm"
      />
    </Suspense>
  )
}
