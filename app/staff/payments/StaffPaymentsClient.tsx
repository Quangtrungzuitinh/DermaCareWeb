"use client"

import { PaymentsClient } from "@/components/shared/PaymentsClient"
import type { UiAppointment } from "@/services/clinic.types"

export function StaffPaymentsClient({ rows }: { rows: UiAppointment[] }) {
  return <PaymentsClient rows={rows} />
}
