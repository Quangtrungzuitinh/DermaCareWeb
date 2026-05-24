"use client"

import { CalendarDays, FileText, Stethoscope, Syringe } from "lucide-react"
import type { PatientTimelineItem, PatientTimelineStatus } from "@/lib/actions/timeline.actions"
import { formatAppointmentDate } from "@/lib/format"

const STATUS_CONFIG: Record<PatientTimelineStatus, { label: string; bg: string; text: string }> = {
  COMPLETED: { label: "Hoàn thành", bg: "#eff6ff", text: "#1d4ed8" },
  CONFIRMED: { label: "Đã xác nhận", bg: "#f0fdf4", text: "#166534" },
  CHECKED_IN: { label: "Đã check-in", bg: "#ecfeff", text: "#0e7490" },
  NO_SHOW: { label: "Không đến", bg: "#f8fafc", text: "#475569" },
}

export function PatientTimelineSection({ timeline }: { timeline: PatientTimelineItem[] }) {
  const completedCount = timeline.filter((item) => item.status === "COMPLETED").length
  const confirmedCount = timeline.filter(
    (item) => item.status === "CONFIRMED" || item.status === "CHECKED_IN",
  ).length

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryPill label="Tổng lượt" value={timeline.length} />
        <SummaryPill label="Hoàn thành" value={completedCount} tone="blue" />
        <SummaryPill label="Đã xác nhận" value={confirmedCount} tone="green" />
      </div>

      <div className="rounded-3xl border border-[#eef2f7] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#eef2f7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#0f2a3f]">
              Dòng thời gian điều trị
            </h3>
            <p className="mt-1 text-sm text-[#64748b]">
              Theo dõi chẩn đoán, bác sĩ phụ trách và dịch vụ đã thực hiện.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f1f5f9] px-3 py-2 text-xs font-semibold text-[#64748b]">
            <CalendarDays className="h-4 w-4 text-[#2563eb]" />
            Mới nhất trước
          </div>
        </div>

        <div className="p-5">
          {timeline.length > 0 ? (
            <div className="relative pl-8 sm:pl-10">
              <div className="absolute bottom-5 left-3 top-5 w-px bg-[#e2e8f0] sm:left-4" />
              <div className="space-y-4">
                {timeline.map((item) => (
                  <TimelineCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

function TimelineCard({ item }: { item: PatientTimelineItem }) {
  const treatments = item.medicalRecord?.treatments ?? []

  return (
    <article className="relative">
      <div className="absolute -left-[1.625rem] top-6 h-3.5 w-3.5 rounded-full border-4 border-white bg-[#1e3a5f] shadow-[0_0_0_1px_#1e3a5f] sm:-left-[2.125rem]" />

      <div className="rounded-3xl border border-[#eef2f7] bg-[#f0f4f8] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#0f2a3f] shadow-sm">
                <CalendarDays className="h-4 w-4 text-[#2563eb]" />
                <time dateTime={item.appointmentDate}>
                  {formatAppointmentDate(item.appointmentDate, "HH:mm dd/MM/yyyy")}
                </time>
              </div>
              <StatusBadge status={item.status} />
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#1d4ed8]">
                <Stethoscope className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-[#0f172a]">
                  BS. {item.doctor.fullName}
                </p>
                <p className="mt-0.5 text-sm text-[#64748b]">
                  {item.doctor.specialty ?? "Chuyên khoa chưa cập nhật"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 text-sm xl:w-[360px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
              Chẩn đoán
            </p>
            <p className="mt-1 line-clamp-3 leading-6 text-[#0f172a]">
              {item.medicalRecord?.diagnosis || "Chưa có chẩn đoán được ghi nhận."}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-[#e2e8f0] pt-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
            <Syringe className="h-4 w-4 text-[#64748b]" />
            Dịch vụ đã thực hiện
          </div>
          {treatments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {treatments.map((treatment) => (
                <span
                  key={treatment.id}
                  className="inline-flex max-w-full items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#334155] shadow-sm"
                  title={treatment.service.name}
                >
                  <span className="truncate">{treatment.service.name}</span>
                  {treatment.quantity > 1 && (
                    <span className="ml-1 text-[#64748b]">x{treatment.quantity}</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">Chưa có dịch vụ điều trị được ghi nhận.</p>
          )}
        </div>
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: PatientTimelineStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  )
}

function SummaryPill({
  label,
  value,
  tone = "slate",
}: {
  label: string
  value: number
  tone?: "slate" | "blue" | "green"
}) {
  const toneClass = {
    slate: "bg-white text-[#0f2a3f]",
    blue: "bg-[#eff6ff] text-[#1d4ed8]",
    green: "bg-[#f0fdf4] text-[#166534]",
  }[tone]

  return (
    <div
      className={`rounded-3xl border border-[#eef2f7] px-5 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${toneClass}`}
    >
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[#e2e8f0] bg-[#f7f9fc] px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#dbeafe] text-[#1d4ed8]">
        <FileText className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#0f172a]">Chưa có lịch sử khám</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748b]">
        Khi bạn có lịch hẹn đã xác nhận hoặc hoàn thành, thông tin khám và dịch vụ điều trị sẽ
        xuất hiện tại đây.
      </p>
    </div>
  )
}
