"use client"

import { ReportDetailDialog } from "@/components/admin/reports/ReportDetailDialog"
import { ReportFilters } from "@/components/admin/reports/ReportFilters"
import { ReportTable } from "@/components/admin/reports/ReportTable"
import { useReportState } from "@/components/admin/reports/useReportState"
import type { UiAppointment, UiService } from "@/services/clinic.types"

export function AdminReportsClient({
  appointments,
  services,
}: {
  appointments: UiAppointment[]
  services: UiService[]
}) {
  const reports = useReportState({ appointments, services })

  return (
    <>
      <div className="space-y-5">
        <ReportFilters
          from={reports.from}
          to={reports.to}
          error={reports.error}
          onFromChange={reports.setFrom}
          onToChange={reports.setTo}
          onCreateReport={reports.createReport}
        />

        <ReportTable
          currentPage={reports.currentPage}
          pageSize={reports.pageSize}
          reports={reports.visibleReports}
          sort={reports.sort}
          total={reports.sortedReports.length}
          onPageChange={reports.setPage}
          onPageSizeChange={reports.setPageSize}
          onSelectReport={reports.setSelected}
          onSortChange={reports.setSort}
        />
      </div>

      <ReportDetailDialog
        report={reports.selected}
        onOpenChange={(open) => {
          if (!open) reports.setSelected(null)
        }}
      />
    </>
  )
}
