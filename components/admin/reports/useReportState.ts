"use client"

import { useEffect, useMemo, useState } from "react"
import { type PageSize } from "@/components/shared/ListPagination"
import { buildReport, toDateInput, type ReportRow } from "@/lib/report-utils"
import type { UiAppointment, UiService } from "@/services/clinic.types"

export type ReportSort = "created-desc" | "from-desc" | "appointments-desc" | "revenue-desc"

export function useReportState({
  appointments,
  services,
}: {
  appointments: UiAppointment[]
  services: UiService[]
}) {
  const today = useMemo(() => new Date(), [])
  const defaultFrom = useMemo(() => {
    const date = new Date(today)
    date.setDate(date.getDate() - 30)
    return toDateInput(date)
  }, [today])
  const defaultTo = useMemo(() => toDateInput(today), [today])

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [reports, setReports] = useState<ReportRow[]>(() => [
    buildReport(appointments, services, defaultFrom, defaultTo),
  ])
  const [sort, setSort] = useState<ReportSort>("created-desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [selected, setSelected] = useState<ReportRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sortedReports = useMemo(() => {
    return reports.slice().sort((a, b) => {
      if (sort === "from-desc") return +new Date(b.from) - +new Date(a.from)
      if (sort === "appointments-desc") return b.totalAppointments - a.totalAppointments
      if (sort === "revenue-desc") {
        return b.depositRevenue + b.treatmentRevenue - (a.depositRevenue + a.treatmentRevenue)
      }
      return +new Date(b.createdAt) - +new Date(a.createdAt)
    })
  }, [reports, sort])

  useEffect(() => {
    setPage(1)
  }, [sort, pageSize, reports.length])

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleReports = sortedReports.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function createReport() {
    if (!from || !to) {
      setError("Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc.")
      return
    }
    if (new Date(from).getTime() > new Date(to).getTime()) {
      setError("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.")
      return
    }

    setError(null)
    setReports((current) => [buildReport(appointments, services, from, to), ...current])
  }

  return {
    currentPage,
    error,
    from,
    pageSize,
    reports,
    selected,
    sort,
    sortedReports,
    to,
    visibleReports,
    createReport,
    setFrom,
    setPage,
    setPageSize,
    setSelected,
    setSort,
    setTo,
  }
}
