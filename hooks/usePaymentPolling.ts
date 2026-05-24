import { useQuery } from "@tanstack/react-query"
import { getAppointmentStatus } from "@/lib/actions/appointment.actions"

async function checkPaymentStatus(appointmentId: string) {
  return getAppointmentStatus(appointmentId)
}

export function usePaymentPolling(appointmentId: string, currentStatus: string) {
  return useQuery({
    queryKey: ["appointment-status", appointmentId],
    queryFn: () => checkPaymentStatus(appointmentId),
    refetchInterval: (query) => {
      const status = query.state?.data?.status || currentStatus
      if (status === "CONFIRMED" || status === "CANCELLED") {
        return false // Stop polling
      }
      return 5000 // Poll every 5s
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    initialData: { status: currentStatus },
  })
}
