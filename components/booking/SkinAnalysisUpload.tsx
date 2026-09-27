"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { Camera, CheckCircle2, Loader2, X } from "lucide-react"
import { analyzeSkinAndMatchDoctor } from "@/lib/actions/skin-analysis.actions"
import { getSkinRoutingGroup, SKIN_SPECIALTIES } from "@/constants/skin-specialties"

interface SkinAnalysisUploadProps {
  onResult: (doctorIds: string[]) => void
  onAssessment?: (assessment: PatientSkinAssessment | null) => void
}

export type PatientSkinAssessment = {
  focusLabel: string
  urgencyLabel: string
  urgencyTone: "blue" | "amber"
  description: string
  matchCount: number
  conditionNames: string[]
  predictions: { label: string; score: number }[]
  recommendedSpecialty: string | null
  skinScore: number | null
  skinScoreLabel: string
  observationTags: string[]
  possibleSigns: string[]
  prepareForVisit: string[]
  seekCareSoonIf: string[]
  triage?: { level: "RED" | "YELLOW" | "GREEN"; label: string; message: string }
}

type AiPrediction = { label?: string; score?: number; alert?: boolean }

function buildPatientAssessment(
  conditionJson: string | null,
  matchCount: number,
  triage?: PatientSkinAssessment["triage"],
): PatientSkinAssessment | null {
  if (!conditionJson) return buildGenericPatientAssessment(matchCount)

  let predictions: AiPrediction[] = []
  try {
    const parsed = JSON.parse(conditionJson) as unknown
    predictions = Array.isArray(parsed)
      ? (parsed as AiPrediction[])
          .filter((item) => item && typeof item.label === "string" && item.label.trim() &&
            typeof item.score === "number" && Number.isFinite(item.score) && item.score >= 0 && item.score <= 1)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 3)
      : []
  } catch {
    return buildGenericPatientAssessment(matchCount)
  }

  if (!predictions.length) return buildGenericPatientAssessment(matchCount)

  const labelText = predictions
    .map((prediction) => prediction.label ?? "")
    .join(" ")
    .toLowerCase()
  const hasAlert = predictions.some((prediction) => prediction.alert)
  const conditionNames = predictions
    .map((prediction) => String(prediction.label ?? "").trim())
    .filter(Boolean)
    .slice(0, 3)
  const skinScore = calculateSkinScore(predictions, hasAlert)

  let focusLabel = "Vùng da bất thường cần bác sĩ xem trực tiếp"
  let observationTags = ["Bề mặt da", "Màu sắc da", "Vùng cần theo dõi"]
  let possibleSigns = [
    "Thay đổi màu sắc, bề mặt hoặc ranh giới vùng da",
    "Cảm giác khó chịu như ngứa, rát, đau hoặc căng da nếu có",
  ]
  if (
    labelText.includes("acne") ||
    labelText.includes("comed") ||
    labelText.includes("pustule") ||
    labelText.includes("blackhead") ||
    labelText.includes("whitehead")
  ) {
    focusLabel = "Dấu hiệu dạng mụn, bít tắc hoặc viêm nhẹ"
    observationTags = ["Mụn", "Bít tắc", "Đỏ nhẹ", "Bề mặt da"]
    possibleSigns = [
      "Nốt đỏ, sưng nhẹ hoặc đau khi chạm",
      "Mụn đầu trắng, đầu đen hoặc vùng da bít tắc",
      "Da dễ kích ứng sau khi dùng mỹ phẩm hoặc thuốc bôi",
    ]
  } else if (
    labelText.includes("melasma") ||
    labelText.includes("pigment") ||
    labelText.includes("tinea nigra") ||
    labelText.includes("dark")
  ) {
    focusLabel = "Thay đổi sắc tố hoặc mảng sẫm màu trên da"
    observationTags = ["Sắc tố", "Không đều màu", "Mảng sẫm", "Theo dõi thay đổi"]
    possibleSigns = [
      "Mảng da sẫm màu hoặc không đều màu",
      "Vùng da thay đổi rõ hơn sau nắng hoặc sau viêm",
      "Mốc thời gian xuất hiện và tốc độ lan rộng nên được ghi lại",
    ]
  } else if (
    labelText.includes("eczema") ||
    labelText.includes("dermatitis") ||
    labelText.includes("psoriasis") ||
    labelText.includes("rosacea") ||
    labelText.includes("lupus")
  ) {
    focusLabel = "Đỏ da, bong tróc hoặc kích ứng cần theo dõi"
    observationTags = ["Đỏ da", "Kích ứng", "Khô/bong tróc", "Hàng rào da"]
    possibleSigns = [
      "Đỏ da, khô, bong vảy hoặc rát",
      "Ngứa tăng khi đổ mồ hôi, sau tắm hoặc dùng sản phẩm mới",
      "Tổn thương có thể tái phát theo từng đợt",
    ]
  } else if (labelText.includes("herpes") || labelText.includes("vesicle")) {
    focusLabel = "Tổn thương dạng mụn nước hoặc kích ứng khu trú"
    observationTags = ["Mụn nước", "Kích ứng khu trú", "Rát/châm chích", "Theo dõi lan rộng"]
    possibleSigns = [
      "Cụm mụn nước, rát hoặc châm chích",
      "Vùng tổn thương nhạy cảm khi chạm",
      "Nên ghi lại thời điểm bắt đầu và có tái phát không",
    ]
  }

  return {
    focusLabel,
    urgencyLabel: hasAlert ? "Nên đặt lịch khám sớm" : "Nên đặt lịch tư vấn",
    urgencyTone: hasAlert ? "amber" : "blue",
    description: hasAlert
      ? "Ảnh có dấu hiệu cần bác sĩ kiểm tra trực tiếp để loại trừ tình trạng cần xử trí sớm."
      : "AI chỉ đọc ảnh để gợi ý hướng khám ban đầu; bác sĩ sẽ là người kết luận sau khi thăm khám.",
    matchCount,
    conditionNames,
    predictions: predictions.map((prediction) => ({ label: prediction.label!, score: prediction.score! })),
    recommendedSpecialty: (() => {
      const group = getSkinRoutingGroup(conditionJson)
      return group ? SKIN_SPECIALTIES[group] : null
    })(),
    skinScore,
    skinScoreLabel: getSkinScoreLabel(skinScore),
    observationTags,
    possibleSigns,
    prepareForVisit: [
      "Thời điểm bắt đầu xuất hiện và thay đổi theo ngày",
      "Có ngứa, đau, rát, chảy dịch hoặc lan rộng không",
      "Mỹ phẩm, thuốc bôi hoặc thuốc uống đã dùng gần đây",
    ],
    seekCareSoonIf: hasAlert
      ? [
          "Vùng da thay đổi nhanh về kích thước, màu sắc hoặc hình dạng",
          "Có đau nhiều, chảy máu, loét, mủ hoặc sốt",
          "Tổn thương ở gần mắt, môi, vùng sinh dục hoặc lan nhanh",
        ]
      : [
          "Triệu chứng lan nhanh hoặc nặng hơn trong vài ngày",
          "Đau, rát, chảy dịch, mủ hoặc ảnh hưởng sinh hoạt",
          "Đã tự dùng thuốc nhưng không cải thiện",
        ],
    triage,
  }
}

function buildGenericPatientAssessment(matchCount: number): PatientSkinAssessment | null {
  if (matchCount <= 0) return null

  return {
    focusLabel: "Ảnh da cần bác sĩ xem trực tiếp",
    urgencyLabel: "Nên đặt lịch tư vấn",
    urgencyTone: "blue",
    description:
      "AI chưa đủ cơ sở để mô tả dấu hiệu cụ thể, nhưng đã gợi ý bác sĩ phù hợp để bạn đặt lịch khám.",
    matchCount,
    conditionNames: [],
    predictions: [],
    recommendedSpecialty: null,
    skinScore: null,
    skinScoreLabel: "Chưa đủ dữ liệu",
    observationTags: ["Tổng quan da", "Vùng cần theo dõi", "Bác sĩ kiểm tra trực tiếp"],
    possibleSigns: [
      "Vùng da có thay đổi mà bạn muốn bác sĩ kiểm tra trực tiếp",
      "Có thể kèm ngứa, đau, rát, khô, nổi nốt hoặc đổi màu nếu bạn đang gặp",
    ],
    prepareForVisit: [
      "Chụp thêm ảnh cùng vùng da trong điều kiện ánh sáng tốt",
      "Ghi lại thời điểm bắt đầu và yếu tố làm nặng hơn",
      "Liệt kê sản phẩm chăm sóc da hoặc thuốc đã dùng",
    ],
    seekCareSoonIf: [
      "Tổn thương lan nhanh, đau nhiều hoặc chảy dịch",
      "Có sốt, sưng nóng đỏ rõ hoặc ảnh hưởng vùng mắt/môi",
      "Bạn lo lắng vì thay đổi mới xuất hiện và tiến triển nhanh",
    ],
    triage: undefined,
  }
}

function calculateSkinScore(predictions: AiPrediction[], hasAlert: boolean) {
  const scores = predictions
    .map((prediction) => Number(prediction.score))
    .filter((score) => Number.isFinite(score) && score >= 0)
    .slice(0, 3)

  if (!scores.length) return null

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const rawScore = Math.max(0, Math.min(10, 10 - average * 10))
  const cappedScore = hasAlert ? Math.min(rawScore, 4.5) : rawScore
  return Math.round(cappedScore * 10) / 10
}

function getSkinScoreLabel(score: number | null) {
  if (score === null) return "Chưa đủ dữ liệu"
  if (score >= 7) return "Tổng quan khá ổn"
  if (score >= 5) return "Mức trung bình"
  return "Cần theo dõi kỹ"
}

function resizeToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement("canvas")
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas not supported"))
      ctx.drawImage(img, 0, 0, 256, 256)
      resolve(canvas.toDataURL("image/jpeg", 0.8).replace(/^data:image\/jpeg;base64,/, ""))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Load failed"))
    }
    img.src = url
  })
}

function PreviewImage({ src, highlighted = false }: { src: string; highlighted?: boolean }) {
  return (
    <Image
      src={src}
      alt=""
      width={48}
      height={48}
      unoptimized
      className={`h-12 w-12 flex-shrink-0 rounded-xl object-cover ${highlighted ? "ring-2 ring-[#2563eb]" : ""}`}
    />
  )
}

export function SkinAnalysisUpload({ onResult, onAssessment }: SkinAnalysisUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  const [assessment, setAssessment] = useState<PatientSkinAssessment | null>(null)
  const [hasAnalysis, setHasAnalysis] = useState(false)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setStatus("loading")
    setAssessment(null)
    setHasAnalysis(false)
    onAssessment?.(null)

    try {
      const base64 = await resizeToBase64(file)
      const result = await analyzeSkinAndMatchDoctor(base64)

      if (result._condition) {
        sessionStorage.setItem(
          "ai_skin",
          JSON.stringify({ condition: result._condition, confidence: result._confidence }),
        )
      } else {
        sessionStorage.removeItem("ai_skin")
      }

      setMatchCount(result.doctorIds.length)
      onResult(result.doctorIds)
      const nextAssessment = buildPatientAssessment(result._condition, result.doctorIds.length, result._triage ?? undefined)
      setAssessment(nextAssessment)
      setHasAnalysis(Boolean(result._condition))
      onAssessment?.(nextAssessment)
      setStatus("done")
    } catch {
      sessionStorage.removeItem("ai_skin")
      onResult([])
      onAssessment?.(null)
      setAssessment(null)
      setHasAnalysis(false)
      setStatus("error")
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ""
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setMatchCount(0)
    setAssessment(null)
    setHasAnalysis(false)
    sessionStorage.removeItem("ai_skin")
    onResult([])
    onAssessment?.(null)
    setStatus("idle")
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-dashed border-[#bfdbfe] bg-[#f7f9fc]">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Tải ảnh da để phân tích AI"
        className="hidden"
        onChange={handleChange}
      />

      {status === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-[#2563eb] transition hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
        >
          <Camera className="h-4 w-4" />
          Chụp hoặc tải ảnh da để AI gợi ý bác sĩ phù hợp
        </button>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-3 px-4 py-3.5">
          {previewUrl && <PreviewImage src={previewUrl} />}
          <div className="flex items-center gap-2 text-sm text-[#2563eb]">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI đang phân tích ảnh da...
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-3 px-4 py-3">
          {previewUrl && <PreviewImage src={previewUrl} highlighted />}
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#16a34a]">
              <CheckCircle2 className="h-4 w-4" />
              {hasAnalysis
                ? matchCount > 0 ? `Gợi ý ${matchCount} bác sĩ đúng nhóm chuyên môn hoặc Da liễu tổng quát` : "Đã phân tích ảnh — chưa có bác sĩ phù hợp"
                : "Chưa có kết quả phân tích ảnh"}
            </div>
            <span className="text-xs text-[#64748b]">
              {hasAnalysis ? "Dựa trên ảnh da của bạn" : "Bạn vẫn có thể chọn bác sĩ để đặt lịch khám"}
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#475569]"
          >
            <X className="h-3 w-3" />
            Xóa
          </button>
        </div>
      )}

      {status === "done" && (
        <div role="status" aria-live="polite" className="border-t border-blue-100 px-4 py-3 text-sm">
          <h3 className="font-semibold text-slate-900">Các tình trạng AI dự đoán từ ảnh</h3>
          {hasAnalysis && assessment ? (
            <>
              {assessment.triage && (
                <div className={`mb-3 rounded-xl border px-3 py-3 ${assessment.triage.level === "RED" ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
                  <div className="font-bold">Mức cảnh báo: {assessment.triage.level}</div>
                  <p className="mt-1 text-sm leading-5">{assessment.triage.message}</p>
                </div>
              )}
              <ol className="mt-3 space-y-2">
                {assessment.predictions.map((prediction, index) => (
                  <li key={prediction.label} className="rounded-lg border border-blue-100 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-slate-900">{prediction.label}</span>
                      <span className="whitespace-nowrap font-semibold text-blue-700">
                        {(prediction.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {index === 0 ? "Dự đoán có điểm cao nhất" : "Dự đoán thay thế"}
                    </p>
                  </li>
                ))}
              </ol>
              {assessment.recommendedSpecialty && (
                <p className="mt-3 font-medium text-slate-800">Nhóm chuyên môn gợi ý: {assessment.recommendedSpecialty}</p>
              )}
              {matchCount === 0 && (
                <p className="mt-2 text-amber-800">
                  Hiện chưa có bác sĩ đã được duyệt thuộc nhóm này hoặc Da liễu tổng quát.
                  Vui lòng liên hệ phòng khám để được hướng dẫn đặt lịch phù hợp.
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Tên tình trạng được giữ nguyên theo kết quả model. Phần trăm là điểm tin cậy
                phân loại, không phải mức độ nặng hay xác suất bạn mắc bệnh. Đây là dự đoán AI,
                cần bác sĩ xác nhận.
              </p>
            </>
          ) : (
            <p className="mt-2 text-slate-600">
              AI chưa đưa ra được nhận định cho ảnh này. Bạn có thể thử lại với ảnh rõ nét,
              đủ sáng hoặc tiếp tục đặt lịch để bác sĩ kiểm tra trực tiếp.
            </p>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-[#64748b]">Không thể phân tích — hiển thị tất cả bác sĩ</span>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#475569]"
          >
            <X className="h-3 w-3" />
            Đặt lại
          </button>
        </div>
      )}
    </div>
  )
}
