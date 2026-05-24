import { ArrowLinkButton } from "@/components/shared/ArrowLinkButton"
import { PanelCard } from "@/components/shared/PanelCard"

type ServiceItem = {
  id: string
  name: string
  count: number
}

type Props = {
  services: ServiceItem[]
  title: string
  subtitle: string
  linkTo: string
  linkLabel: string
}

export function TopServicesChart({ services, title, subtitle, linkTo, linkLabel }: Props) {
  const max = Math.max(...services.map((service) => service.count), 1)
  const tickMax = Math.ceil(max / 10) * 10 || 10
  const ticks = [tickMax, Math.round(tickMax * 0.66), Math.round(tickMax * 0.33), 0]

  return (
    <PanelCard className="flex min-h-[320px] flex-col">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-navy-dark">{title}</h3>
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        </div>
        <ArrowLinkButton to={linkTo} label={linkLabel} />
      </div>

      <div className="relative mt-4 flex min-h-[200px] flex-1 items-end justify-between gap-2 pl-8">
        <div className="absolute bottom-6 left-0 top-0 flex flex-col justify-between text-[11px] text-muted-soft">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="absolute left-8 right-0 top-7 border-t border-dashed border-hairline" />
        {services.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl bg-surface-soft py-10 text-sm text-muted">
            Chưa có dữ liệu dịch vụ.
          </div>
        ) : (
          services.map((service, index) => {
            const isTop = index === 0
            const height = (service.count / tickMax) * 150
            return (
              <div
                key={service.id}
                className="group/service relative flex flex-1 flex-col items-center gap-2"
              >
                {isTop && (
                  <span className="absolute -top-6 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    {service.count} lượt
                  </span>
                )}
                <div
                  className={`w-full origin-bottom rounded-full transition-transform duration-200 group-hover/service:scale-y-105 ${
                    isTop ? "bg-primary" : "bg-primary-light"
                  }`}
                  style={{
                    height: Math.max(height, 14),
                    maxWidth: 38,
                    opacity: service.count === 0 ? 0.35 : 1,
                  }}
                />
                <span
                  className={`line-clamp-2 text-center text-[10px] leading-tight transition-colors group-hover/service:text-primary ${
                    isTop ? "font-semibold text-navy-dark" : "text-muted"
                  }`}
                >
                  {service.name}
                </span>
              </div>
            )
          })
        )}
      </div>
    </PanelCard>
  )
}
