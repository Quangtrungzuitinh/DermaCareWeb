"use client"

import { RouteErrorState } from "@/components/shared/RouteErrorState"

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteErrorState error={error} reset={reset} homeHref="/admin/dashboard" />
}
