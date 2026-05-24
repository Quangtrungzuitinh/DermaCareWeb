import { prisma } from "@/lib/prisma"
import { formatVND } from "@/lib/format"

// Fallback service data matching the demo exactly
const FALLBACK_SERVICES = [
  {
    id: "fallback-1",
    name: "Khám da tổng quát",
    description:
      "Kiểm tra tổng thể tình trạng da, chẩn đoán bệnh lý và tư vấn phác đồ điều trị phù hợp.",
    price: 300000,
    durationMinutes: 30,
    icon: "clock",
  },
  {
    id: "fallback-2",
    name: "Điều trị mụn",
    description:
      "Phác đồ điều trị mụn chuyên sâu, kết hợp công nghệ ánh sáng và sản phẩm chuyên biệt.",
    price: 500000,
    durationMinutes: 45,
    icon: "shield",
  },
  {
    id: "fallback-3",
    name: "Trẻ hóa da",
    description:
      "Các liệu pháp trẻ hóa hiện đại: laser, RF, microneedling — phục hồi độ đàn hồi và săn chắc cho da.",
    price: 1200000,
    durationMinutes: 60,
    icon: "heart",
  },
]

// SVG icons matching the demo
function ServiceIcon({ type }: { type: string }) {
  switch (type) {
    case "clock":
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-navy fill-none"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    case "shield":
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-navy fill-none"
          strokeWidth={2}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    case "heart":
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-navy fill-none"
          strokeWidth={2}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-navy fill-none"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
  }
}

export async function ServicesSection() {
  let services: typeof FALLBACK_SERVICES = []

  try {
    const dbServices = await prisma.service.findMany({
      where: { isActive: true },
      take: 3,
    })
    if (dbServices.length > 0) {
      services = dbServices.map((s, i) => ({
        id: s.id,
        name: s.name,
        description:
          s.description || FALLBACK_SERVICES[i]?.description || "Phác đồ điều trị chuyên biệt.",
        price: s.price,
        durationMinutes: FALLBACK_SERVICES[i]?.durationMinutes ?? 30,
        icon: FALLBACK_SERVICES[i]?.icon ?? "clock",
      }))
    } else {
      services = FALLBACK_SERVICES
    }
  } catch {
    services = FALLBACK_SERVICES
  }

  return (
    <section id="services" className="bg-surface-soft py-20 px-[5%]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[30px] font-[800] text-ink text-center tracking-[-0.5px] mb-2">
          Dịch vụ của chúng tôi
        </h2>
        <p className="text-[15px] text-muted text-center mb-12 leading-[1.6]">
          Giải pháp chăm sóc da toàn diện, từ điều trị đến thẩm mỹ da
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-xl border border-hairline bg-white p-6 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-elevated"
            >
              <div className="w-11 h-11 bg-navy-light rounded-[10px] flex items-center justify-center mb-4">
                <ServiceIcon type={service.icon} />
              </div>
              <div className="text-[16px] font-bold text-ink mb-2">{service.name}</div>
              <div className="text-[14px] text-muted leading-[1.6] mb-4">{service.description}</div>
              <div className="text-[14px] font-semibold text-navy">
                {formatVND(service.price)} · {service.durationMinutes} phút
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
