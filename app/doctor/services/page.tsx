import { DoctorShell } from "@/components/doctor/DoctorShell"
import { getServices } from "@/services/clinic.service"
import { formatVND } from "@/lib/format"

export default async function DoctorServicesPage() {
  const services = await getServices(false)

  return (
    <DoctorShell title="Dịch vụ" description={`${services.length} dịch vụ đang cung cấp`}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.id}
            className="rounded-3xl border border-hairline-muted bg-white p-5"
          >
            <h3 className="text-lg font-semibold text-ink">{service.name}</h3>
            <p className="mt-2 min-h-10 text-sm text-muted">
              {service.description ?? "Dịch vụ đang được áp dụng tại phòng khám."}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted">{service.durationMinutes} phút</span>
              <span className="font-semibold text-ink">{formatVND(service.price)}</span>
            </div>
          </article>
        ))}
      </div>
    </DoctorShell>
  )
}
