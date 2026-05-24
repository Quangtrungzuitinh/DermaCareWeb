import { TopServicesChart as SharedTopServicesChart } from "@/components/shared/TopServicesChart"

type TopService = { id: string; name: string; count: number }

type Props = {
  services: TopService[]
}

export function TopServicesChart({ services }: Props) {
  return (
    <SharedTopServicesChart
      services={services}
      title="Top dịch vụ điều trị"
      subtitle="Tính theo hồ sơ đã có y lệnh"
      linkTo="/doctor/medical-records"
      linkLabel="Mở hồ sơ bệnh án"
    />
  )
}
