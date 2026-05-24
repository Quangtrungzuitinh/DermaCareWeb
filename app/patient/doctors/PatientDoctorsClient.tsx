"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { AlertTriangle, Camera, CheckCircle2, ClipboardList, Sparkles, Star, Users } from "lucide-react"
import { SkinAnalysisUpload, type PatientSkinAssessment } from "@/components/booking/SkinAnalysisUpload"
import { JoinWaitlistButton } from "@/components/patient/JoinWaitlistButton"
import type { UiDoctor, UiService } from "@/services/clinic.types"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0]?.charAt(0) ?? "B").toUpperCase()
  return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase()
}

export function PatientDoctorsClient({
  doctors,
  services,
  visitedDoctorIds,
}: {
  doctors: UiDoctor[]
  services: UiService[]
  visitedDoctorIds: string[]
}) {
  const [aiDoctorIds, setAiDoctorIds] = useState<string[]>([])
  const [assessment, setAssessment] = useState<PatientSkinAssessment | null>(null)
  const visitedIds = useMemo(() => new Set(visitedDoctorIds), [visitedDoctorIds])
  const aiIds = useMemo(() => new Set(aiDoctorIds), [aiDoctorIds])

  const aiDoctors = useMemo(
    () =>
      aiDoctorIds
        .map((id) => doctors.find((d) => d.id === id))
        .filter((d): d is UiDoctor => Boolean(d)),
    [aiDoctorIds, doctors],
  )
  const visitedDoctors = doctors.filter((d) => visitedIds.has(d.id) && !aiIds.has(d.id))
  const discoverDoctors = doctors.filter((d) => !visitedIds.has(d.id) && !aiIds.has(d.id))
  const showAiResult = aiDoctors.length > 0

  return (
    <div className="space-y-5">
      {/* ─── Upload + AI Result ─── */}
      <section className="rounded-3xl border border-[#eef2f7] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff]">
            <Camera className="h-5 w-5 text-[#2563eb]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0f172a]">Phân tích ảnh da với AI</h2>
            <p className="mt-0.5 text-sm text-[#64748b]">
              Tải ảnh da để hệ thống gợi ý bác sĩ phù hợp. Bệnh nhân chỉ thấy gợi ý đặt lịch,
              không hiển thị nhãn bệnh hay điểm tin cậy.
            </p>
          </div>
        </div>

        <SkinAnalysisUpload onResult={setAiDoctorIds} onAssessment={setAssessment} />

        {assessment && <PatientAssessmentPanel assessment={assessment} />}

        {showAiResult && !assessment && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16a34a]">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#15803d]">
                AI đã tìm thấy {aiDoctors.length} bác sĩ phù hợp với ảnh của bạn
              </p>
              <p className="mt-0.5 text-xs text-[#64748b]">
                Kết quả chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ─── AI Recommended Doctors (Feature G) ─── */}
      {aiDoctors.length > 0 && (
        <section className="rounded-3xl border border-[#bfdbfe] bg-[#eff6ff]/50 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5 text-[#2563eb]" />}
            iconBg="bg-[#dbeafe]"
            title="Bác sĩ được AI gợi ý"
            description="Các bác sĩ phù hợp được ưu tiên để bạn đặt lịch nhanh hơn."
            badge={`${aiDoctors.length} gợi ý`}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aiDoctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} services={services} highlighted />
            ))}
          </div>
        </section>
      )}

      {/* ─── Previously Visited ─── */}
      <section className="rounded-3xl border border-[#eef2f7] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <SectionHeader
          icon={<Star className="h-5 w-5 text-[#d97706]" />}
          iconBg="bg-[#fef3c7]"
          title="Bác sĩ đã từng khám"
          description="Những bác sĩ bạn đã có lịch hẹn hoàn thành."
        />
        {visitedDoctors.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visitedDoctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} services={services} />
            ))}
          </div>
        ) : visitedDoctorIds.length > 0 && showAiResult ? (
          <EmptyNote text="Các bác sĩ bạn từng khám đang nằm trong nhóm gợi ý phía trên." />
        ) : (
          <EmptyNote text="Bạn chưa có lịch khám hoàn thành." />
        )}
      </section>

      {/* ─── Discover ─── */}
      <section className="rounded-3xl border border-[#eef2f7] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <SectionHeader
          icon={<Users className="h-5 w-5 text-[#64748b]" />}
          iconBg="bg-[#f1f5f9]"
          title="Khám phá bác sĩ"
          description="Tất cả bác sĩ đang hoạt động tại phòng khám."
        />
        {discoverDoctors.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {discoverDoctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} services={services} />
            ))}
          </div>
        ) : (
          <EmptyNote text="Không còn bác sĩ khác để hiển thị." />
        )}
      </section>
    </div>
  )
}

function SectionHeader({
  icon,
  iconBg,
  title,
  description,
  badge,
}: {
  icon: ReactNode
  iconBg: string
  title: string
  description: string
  badge?: string
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-[#0f172a]">{title}</h2>
          <p className="mt-0.5 text-sm text-[#64748b]">{description}</p>
        </div>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
          {badge}
        </span>
      )}
    </div>
  )
}

function PatientAssessmentPanel({ assessment }: { assessment: PatientSkinAssessment }) {
  const urgencyTone =
    assessment.urgencyTone === "amber"
      ? "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]"
      : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
  const conditionText = assessment.conditionNames.length
    ? assessment.conditionNames.join(", ")
    : assessment.focusLabel
  const scorePercent = assessment.skinScore === null ? 50 : assessment.skinScore * 10

  return (
    <div className="mt-4 rounded-3xl border border-[#dbeafe] bg-[#f8fbff] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white">
            <ClipboardList className="h-5 w-5 text-[#2563eb]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0f172a]">Nhận định sơ bộ từ ảnh</h3>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-[#0f172a]">
              AI gợi ý: {conditionText}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#64748b]">
              Đây là gợi ý từ ảnh, không phải chẩn đoán cuối cùng.
            </p>
          </div>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${urgencyTone}`}>
          {assessment.urgencyLabel}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
              Điểm da tổng
            </div>
            <div className="mt-1 text-sm font-semibold text-[#0f172a]">
              {assessment.skinScore === null ? "Chưa đủ dữ liệu" : `${assessment.skinScore}/10`} ·{" "}
              {assessment.skinScoreLabel}
            </div>
          </div>
          <div className="text-xs font-semibold text-[#64748b]">Trung bình từ điểm AI</div>
        </div>

        <div className="mt-3">
          <div className="relative h-3 rounded-full bg-gradient-to-r from-[#ef4444] via-[#fde047] to-[#22c55e]">
            <div
              className="absolute top-1/2 h-6 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0f172a]"
              style={{ left: `${scorePercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold text-[#64748b]">
            <span>0</span>
            <span>Điểm trung bình</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white px-4 py-3 text-xs leading-relaxed text-[#64748b]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
        <span>
          Lưu ý: nếu vùng da lan nhanh, đau/rát nhiều, chảy dịch hoặc thay đổi rõ trong vài ngày,
          nên đặt lịch khám sớm. Có {assessment.matchCount} bác sĩ phù hợp được gợi ý.
        </span>
      </div>
    </div>
  )
}

function DoctorCard({
  doctor,
  services,
  highlighted = false,
}: {
  doctor: UiDoctor
  services: UiService[]
  highlighted?: boolean
}) {
  const initials = getInitials(doctor.fullName)

  return (
    <article
      className={`rounded-3xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 ${
        highlighted
          ? "border-[#bfdbfe] shadow-[0_4px_20px_rgba(37,99,235,0.12)] hover:shadow-[0_10px_30px_rgba(37,99,235,0.18)]"
          : "border-[#eef2f7] shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]"
      }`}
    >
      {/* Header row */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-bold text-[#1d4ed8]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-[#0f172a]">BS. {doctor.fullName}</h3>
            {highlighted && (
              <span className="shrink-0 rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1d4ed8]">
                AI gợi ý
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#64748b]">
            {doctor.specialty ?? "Da liễu tổng quát"}
          </p>
        </div>
      </div>

      {/* Patient-facing summary */}
      <div className="mb-4 rounded-2xl bg-[#f7f9fc] px-3 py-2 text-xs leading-relaxed text-[#64748b]">
        {highlighted
          ? "Phù hợp để bạn tham khảo đặt lịch sau khi tải ảnh da."
          : "Có thể đặt lịch khám hoặc tham gia hàng chờ khi chưa có khung giờ phù hợp."}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/patient/booking/select?doctorId=${doctor.id}`}
          className="inline-flex h-9 items-center rounded-full bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          Đặt lịch
        </Link>
        {services.length > 0 && <JoinWaitlistButton doctorId={doctor.id} services={services} />}
      </div>
    </article>
  )
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f9fc] px-5 py-6 text-sm text-[#64748b]">{text}</div>
  )
}
