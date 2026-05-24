"use client"

import { RouteErrorState } from "@/components/shared/RouteErrorState"

export default function DoctorErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteErrorState error={error} reset={reset} homeHref="/doctor/dashboard" />
}
