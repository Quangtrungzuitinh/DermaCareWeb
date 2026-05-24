"use client"

import { useEffect, useMemo, useState } from "react"
import { type PageSize } from "@/components/shared/ListPagination"
import { type SortOption } from "@/components/shared/SortButton"
import type { UiService } from "@/services/clinic.types"

export type FilterStatus = "ALL" | "ACTIVE" | "HIDDEN"
export type ServiceSort = "name" | "price-desc" | "duration" | "booking-desc"

export const SERVICE_SORT_OPTIONS: SortOption<ServiceSort>[] = [
  { value: "name", label: "Tên dịch vụ" },
  { value: "price-desc", label: "Giá cao" },
  { value: "duration", label: "Thời lượng" },
  { value: "booking-desc", label: "30 ngày cao" },
]

export function useServiceDirectoryState(services: UiService[]) {
  const [query, setQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL")
  const [sort, setSort] = useState<ServiceSort>("name")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [showCreate, setShowCreate] = useState(false)

  const activeCount = services.filter((service) => service.isActive).length
  const hiddenCount = services.length - activeCount

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const source = services.filter((service) => {
      const matchesQ = !q || service.name.toLowerCase().includes(q)
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" && service.isActive) ||
        (filterStatus === "HIDDEN" && !service.isActive)
      return matchesQ && matchesStatus
    })

    return source.slice().sort((a, b) => {
      if (sort === "price-desc") return b.price - a.price
      if (sort === "duration") return a.durationMinutes - b.durationMinutes
      if (sort === "booking-desc") return (b.bookingCount30d ?? 0) - (a.bookingCount30d ?? 0)
      return a.name.localeCompare(b.name, "vi")
    })
  }, [services, query, filterStatus, sort])

  useEffect(() => {
    setPage(1)
  }, [query, filterStatus, sort, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleServices = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return {
    activeCount,
    currentPage,
    filtered,
    filterStatus,
    hiddenCount,
    pageSize,
    query,
    showCreate,
    sort,
    visibleServices,
    setFilterStatus,
    setPage,
    setPageSize,
    setQuery,
    setShowCreate,
    setSort,
  }
}
