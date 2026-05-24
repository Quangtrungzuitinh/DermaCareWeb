import { requireRole } from "@/lib/auth/require-role"
import { PatientShell } from "@/components/patient/PatientShell"
import { PatientChatClient } from "./PatientChatClient"

export const metadata = {
  title: "Chat hỗ trợ | DermaCare",
}

export default async function PatientChatPage() {
  await requireRole(["PATIENT"])

  return (
    <PatientShell title="Chat hỗ trợ" description="Hỏi đáp về dịch vụ, đặt lịch qua chatbot">
      <div className="mx-auto w-full max-w-[1440px]">
        <PatientChatClient />
      </div>
    </PatientShell>
  )
}
