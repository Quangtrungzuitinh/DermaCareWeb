import { Wallet } from "lucide-react"

import { DashboardBarCard, DARK } from "@/components/admin/dashboard/DashboardBarCard"
import { formatVND } from "@/lib/format"

type Props = {
  total: number
  updatedLabel: string
  bars: { date: Date; value: number }[]
}

export function TreatmentValueCard({ total, updatedLabel, bars }: Props) {
  return (
    <DashboardBarCard
      icon={Wallet}
      label="Giá trị y lệnh (7 ngày)"
      value={formatVND(total)}
      updatedLabel={updatedLabel}
      bars={bars}
      barColor={DARK}
      barOpacityEmpty={0.25}
    />
  )
}
