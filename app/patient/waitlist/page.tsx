import { getMyWaitlist } from "@/lib/actions/waitlist.actions"
import { WaitlistClient } from "./WaitlistClient"

export default async function PatientWaitlistPage() {
  const entries = await getMyWaitlist()
  return <WaitlistClient entries={entries} />
}
