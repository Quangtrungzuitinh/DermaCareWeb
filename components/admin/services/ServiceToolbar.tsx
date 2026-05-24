"use client"

import { Plus, Search } from "lucide-react"
import { SortButton } from "@/components/shared/SortButton"
import {
  SERVICE_SORT_OPTIONS,
  type FilterStatus,
  type ServiceSort,
} from "@/components/admin/services/useServiceDirectoryState"

export function ServiceToolbar({
  activeCount,
  filterStatus,
  hiddenCount,
  query,
  serviceCount,
  sort,
  onCreateClick,
  onFilterStatusChange,
  onQueryChange,
  onSortChange,
}: {
  activeCount: number
  filterStatus: FilterStatus
  hiddenCount: number
  query: string
  serviceCount: number
  sort: ServiceSort
  onCreateClick: () => void
  onFilterStatusChange: (status: FilterStatus) => void
  onQueryChange: (query: string) => void
  onSortChange: (sort: ServiceSort) => void
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Tìm theo tên dịch vụ..."
          className="h-10 w-full rounded-full border border-hairline bg-white pl-10 pr-4 text-sm placeholder:text-muted-soft focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 md:ml-auto">
        <SortButton
          value={sort}
          options={SERVICE_SORT_OPTIONS}
          onChange={onSortChange}
          label="Sắp xếp dịch vụ"
        />
        <div className="flex gap-1.5">
          {(["ALL", "ACTIVE", "HIDDEN"] as FilterStatus[]).map((key) => {
            const labels = {
              ALL: `Tất cả ${serviceCount}`,
              ACTIVE: `Đang bật ${activeCount}`,
              HIDDEN: `Đã ẩn ${hiddenCount}`,
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => onFilterStatusChange(key)}
                className={`h-9 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition ${
                  filterStatus === key
                    ? "bg-primary text-white shadow-sm"
                    : "border border-hairline bg-white text-body hover:bg-surface-card"
                }`}
              >
                {labels[key]}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={onCreateClick}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm
        </button>
      </div>
    </div>
  )
}
