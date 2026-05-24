import { redirect } from "next/navigation"

export default function CalendarPage() {
  redirect("/patient/appointments?tab=calendar")
}
