"use client"

import { Activity, Clock } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PatientProgressSummary } from "@/services/patient.types"

export function MyProgressChart({ progress }: { progress: PatientProgressSummary | null }) {
  if (!progress) {
    return (
      <section className="rounded-3xl border border-[#eef2f7] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff]">
            <Activity className="h-5 w-5 text-[#2563eb]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Theo dõi tiến triển</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              Cần ít nhất 2 lần khám có ảnh được bác sĩ xác nhận để hiển thị xu hướng.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-[#eef2f7] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff]">
            <Activity className="h-5 w-5 text-[#2563eb]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Theo dõi tiến triển</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              AI hỗ trợ tổng hợp xu hướng từ ảnh da đã được lưu trong hồ sơ.
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#f7f9fc] px-4 py-3 text-right">
          <div className="text-sm font-bold text-[#0f172a]">{progress.label}</div>
          <div className="mt-0.5 text-xs text-[#64748b]">
            {progress.improvementPct !== null
              ? `Cải thiện ${progress.improvementPct}%`
              : `${progress.visitCount} lần theo dõi`}
          </div>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={progress.chartPoints} margin={{ left: -24, right: 12, top: 12 }}>
            <CartesianGrid stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Mức cải thiện"]}
              labelFormatter={(label) => `Ngày ${label}`}
            />
            <Line
              type="monotone"
              dataKey="progressScore"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {progress.pendingDoctorReview && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          Một số điểm dữ liệu đang chờ bác sĩ xác nhận.
        </div>
      )}
    </section>
  )
}
