import { AlertTriangle, Brain } from "lucide-react"

type AiPrediction = { label: string; score: number; alert?: boolean }

export function AiPredictionPanel({
  aiPredictedCondition,
}: {
  aiPredictedCondition: string | null
}) {
  if (!aiPredictedCondition) return null

  let predictions: AiPrediction[] = []
  try {
    predictions = JSON.parse(aiPredictedCondition) as AiPrediction[]
  } catch {
    return null
  }
  if (!predictions.length) return null

  const hasAlert = predictions.some((p) => p.alert)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#f0f4f8] px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#2563eb]" />
          <span className="text-xs font-bold uppercase tracking-wide text-[#2563eb]">
            Phân tích da AI
          </span>
        </div>
        <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-0.5 text-[11px] font-medium text-[#2563eb]">
          Tham khảo trước khám
        </span>
      </div>

      <div className="space-y-3 p-4">
        {/* Alert banner */}
        {hasAlert && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="text-xs font-semibold text-red-700">
              Phát hiện tình trạng nghiêm trọng — ưu tiên khám kỳ
            </span>
          </div>
        )}

        {/* Predictions list */}
        <div className="space-y-3">
          {predictions.map((p, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#94a3b8]">#{i + 1}</span>
                  <span
                    className={`text-sm font-semibold ${p.alert ? "text-red-600" : "text-[#0f172a]"}`}
                  >
                    {p.label}
                  </span>
                  {p.alert && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      Nghiêm trọng
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm font-bold ${p.alert ? "text-red-600" : "text-[#334155]"}`}
                >
                  {Math.round(p.score * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
                <div
                  className={`h-full rounded-full ${p.alert ? "bg-red-400" : "bg-[#2563eb]"}`}
                  style={{ width: `${Math.round(p.score * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="text-[11px] leading-relaxed text-amber-700">
            Chỉ mang tính tham khảo, không thay thế chẩn đoán lâm sàng — Model DINOv2 (31 loại
            bệnh da)
          </span>
        </div>
      </div>
    </div>
  )
}
