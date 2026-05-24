import { redirect } from "next/navigation"
import { BookingConfirmClient } from "@/components/booking/BookingConfirmClient"
import { fetchBookingConfirmData } from "@/lib/booking-data"

export type BookingConfirmSearchParams = {
  doctorId?: string
  serviceId?: string
  date?: string
  slot?: string
  mode?: string
  note?: string
}

type Props = {
  searchParams: Promise<BookingConfirmSearchParams>
  selectPath: string
  paymentBasePath: string
}

export async function BookingConfirmPage({ searchParams, selectPath, paymentBasePath }: Props) {
  const params = await searchParams
  const data = await fetchBookingConfirmData(params)
  if (!data) redirect(selectPath)

  const { doctor, service, patient } = data
  return (
    <BookingConfirmClient
      doctor={{ id: doctor.id, fullName: doctor.profile.fullName, specialty: doctor.specialty }}
      service={service ? { id: service.id, name: service.name, price: service.price } : null}
      profile={patient}
      date={params.date!}
      slot={params.slot!}
      mode={params.mode ?? "doctor"}
      note={params.note ?? ""}
      selectPath={selectPath}
      paymentBasePath={paymentBasePath}
    />
  )
}
