import { formatVND } from "@/lib/format"

type TreatmentLine = {
  id: string
  serviceName: string
  quantity: number
  priceAtTime: number
  notes?: string | null
  instruction?: string | null
}

export function TreatmentServicesPanel({ treatments }: { treatments: TreatmentLine[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline-muted">
      <div className="border-b border-hairline-muted px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Dịch vụ điều trị</h3>
      </div>
      <div className="divide-y divide-hairline-soft">
        {treatments.map((treatment) => (
          <div key={treatment.id} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-sm">
            <div className="min-w-0">
              <div className="font-semibold text-ink">{treatment.serviceName}</div>
              <div className="text-xs text-muted">
                SL {treatment.quantity}
                {getTreatmentNote(treatment) ? ` - ${getTreatmentNote(treatment)}` : ""}
              </div>
            </div>
            <div className="text-right font-semibold text-ink">
              {formatVND(treatment.priceAtTime * treatment.quantity)}
            </div>
          </div>
        ))}
        {treatments.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted">Chưa có dịch vụ điều trị.</div>
        )}
      </div>
    </div>
  )
}

function getTreatmentNote(treatment: TreatmentLine) {
  return treatment.notes ?? treatment.instruction ?? ""
}
