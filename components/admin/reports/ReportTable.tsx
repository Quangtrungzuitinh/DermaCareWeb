"use client"

import { Eye } from "lucide-react"
import { ListPagination, type PageSize } from "@/components/shared/ListPagination"
import { SortButton, type SortOption } from "@/components/shared/SortButton"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import { formatInputDate, type ReportRow } from "@/lib/report-utils"
import type { ReportSort } from "./useReportState"

const REPORT_SORT_OPTIONS: SortOption<ReportSort>[] = [
  { value: "created-desc", label: "Mới tạo" },
  { value: "from-desc", label: "Ngày báo cáo" },
  { value: "appointments-desc", label: "Nhiều lịch" },
  { value: "revenue-desc", label: "Doanh thu cao" },
]

export function ReportTable({
  currentPage,
  pageSize,
  reports,
  sort,
  total,
  onPageChange,
  onPageSizeChange,
  onSelectReport,
  onSortChange,
}: {
  currentPage: number
  pageSize: PageSize
  reports: ReportRow[]
  sort: ReportSort
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
  onSelectReport: (report: ReportRow) => void
  onSortChange: (sort: ReportSort) => void
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-hairline-muted bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">Danh sách báo cáo</h3>
          <p className="text-xs text-muted">{total} báo cáo đã tạo trong phiên này</p>
        </div>
        <SortButton
          value={sort}
          options={REPORT_SORT_OPTIONS}
          onChange={onSortChange}
          label="Sắp xếp báo cáo"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-[11px] uppercase tracking-wider text-muted-soft">
              <th className="px-5 py-3 font-medium">Khoảng ngày</th>
              <th className="px-5 py-3 text-right font-medium">Tổng lịch</th>
              <th className="px-5 py-3 text-right font-medium">Hoàn thành</th>
              <th className="px-5 py-3 text-right font-medium">Doanh thu cọc</th>
              <th className="px-5 py-3 font-medium">Tạo lúc</th>
              <th className="px-5 py-3 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-surface-soft">
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-ink">
                  {formatInputDate(report.from)} - {formatInputDate(report.to)}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-ink">
                  {report.totalAppointments}
                </td>
                <td className="px-5 py-4 text-right text-[#475569]">
                  {report.completedAppointments}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-ink">
                  {formatVND(report.depositRevenue)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-[#475569]">
                  {formatAppointmentDate(report.createdAt, "HH:mm dd/MM/yyyy")}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectReport(report)}
                    className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface-card"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Xem
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListPagination
        total={total}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemLabel="báo cáo"
      />
    </div>
  )
}
