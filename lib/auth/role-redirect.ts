import type { Role } from "@/lib/generated/prisma"

export function getPostLoginPath(role?: Role | string | null) {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard"
    case "STAFF":
      return "/staff/dashboard"
    case "DOCTOR":
      return "/doctor"
    case "PATIENT":
    default:
      return "/patient/dashboard"
  }
}
