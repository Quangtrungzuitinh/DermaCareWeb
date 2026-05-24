import { ChatWidget } from "@/components/chat/ChatWidget"
import { requireRole } from "@/lib/auth/require-role"

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["PATIENT"])

  return (
    <>
      {children}
      <ChatWidget allowBooking />
    </>
  )
}
