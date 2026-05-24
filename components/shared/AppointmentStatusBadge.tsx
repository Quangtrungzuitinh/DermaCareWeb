"use client"

import type { AppointmentStatus } from "@/lib/generated/prisma"
import {
  APPOINTMENT_STATUS_BADGE_CLASSES,
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/appointment-status"

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${APPOINTMENT_STATUS_BADGE_CLASSES[status]}`}
    >
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  )
}
