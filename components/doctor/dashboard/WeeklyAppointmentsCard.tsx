import { CalendarCheck2 } from "lucide-react"

import { DashboardBarCard } from "@/components/admin/dashboard/DashboardBarCard"

type Props = {
  total: number
  updatedLabel: string
  bars: { date: Date; value: number }[]
}

export function WeeklyAppointmentsCard({ total, updatedLabel, bars }: Props) {
  return (
    <DashboardBarCard
      icon={CalendarCheck2}
      label="Tổng lịch hẹn trong tuần"
      value={String(total)}
      updatedLabel={updatedLabel}
      bars={bars}
      barColor="#bfdbfe"
      barOpacityEmpty={0.4}
    />
  )
}
