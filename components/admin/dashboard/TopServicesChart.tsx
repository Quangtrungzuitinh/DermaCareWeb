import { TopServicesChart as SharedTopServicesChart } from "@/components/shared/TopServicesChart"

type ServiceItem = {
  id: string
  name: string
  count: number
}

export function TopServicesChart({
  services,
  linkTo = "/admin/services",
  linkLabel = "Mở danh mục dịch vụ",
  subtitle = "Số lượt đặt lịch gần đây",
}: {
  services: ServiceItem[]
  linkTo?: string
  linkLabel?: string
  subtitle?: string
}) {
  return (
    <SharedTopServicesChart
      services={services}
      title="Top dịch vụ (30 ngày)"
      subtitle={subtitle}
      linkTo={linkTo}
      linkLabel={linkLabel}
    />
  )
}
