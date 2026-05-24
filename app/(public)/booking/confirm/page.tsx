import {
  BookingConfirmPage,
  type BookingConfirmSearchParams,
} from "@/components/booking/pages/BookingConfirmPage"

interface PageProps {
  searchParams: Promise<BookingConfirmSearchParams>
}

export default function Page({ searchParams }: PageProps) {
  return (
    <BookingConfirmPage
      searchParams={searchParams}
      selectPath="/booking/select"
      paymentBasePath="/booking/payment"
    />
  )
}
