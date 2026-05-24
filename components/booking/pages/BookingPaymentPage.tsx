import { redirect } from "next/navigation"
import { formatAppointmentDate } from "@/lib/format"
import { getSepayDepositDetails } from "@/lib/sepay-deposit-qr"
import { fetchBookingPaymentAppointment } from "@/lib/booking-data"
import { PaymentPageClient } from "@/components/booking/PaymentPageClient"

type Props = {
  params: Promise<{ id: string }>
  selectPath: string
}

export async function BookingPaymentPage({ params, selectPath }: Props) {
  const { id } = await params
  const appointment = await fetchBookingPaymentAppointment(id)

  if (!appointment) redirect(selectPath)
  if (appointment.status === "CONFIRMED") redirect(`/booking/success?id=${appointment.id}`)
  if (appointment.status === "CANCELLED") redirect(selectPath)

  return (
    <PaymentPageClient
      selectPath={selectPath}
      appointment={{
        id: appointment.id,
        status: appointment.status,
        createdAt: appointment.createdAt.toISOString(),
        baseFee: appointment.baseFee,
        appointmentDate: formatAppointmentDate(appointment.appointmentDate, "HH:mm dd/MM/yyyy"),
        doctorName: `BS. ${appointment.doctor.profile?.fullName ?? "Bác sĩ đã ngừng hoạt động"}`,
        payment: getSepayDepositDetails(appointment.id, appointment.baseFee),
      }}
    />
  )
}
