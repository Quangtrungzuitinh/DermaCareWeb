import { RouteLoadingState } from "@/components/shared/RouteLoadingState"

export default function PatientHealthRecordsLoading() {
  return <RouteLoadingState titleWidth="w-72" statCards={4} rows={4} showSidePanel />
}
