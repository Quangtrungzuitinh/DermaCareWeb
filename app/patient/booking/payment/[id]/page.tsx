import { BookingPaymentPage } from "@/components/booking/pages/BookingPaymentPage"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function Page({ params }: PageProps) {
  return <BookingPaymentPage params={params} selectPath="/patient/booking/select" />
}
