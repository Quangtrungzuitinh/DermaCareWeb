import { requireRole } from "@/lib/auth/require-role"
import type { ReactNode } from "react"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(["ADMIN"])
  return <>{children}</>
}
