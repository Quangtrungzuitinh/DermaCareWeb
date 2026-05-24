"use client"

import { Search } from "lucide-react"
import { SortButton } from "@/components/shared/SortButton"
import {
  PATIENT_SORT_OPTIONS,
  type PatientSort,
} from "@/components/shared/patient-directory/usePatientDirectoryState"

export function PatientDirectoryToolbar({
  query,
  sort,
  onQueryChange,
  onSortChange,
}: {
  query: string
  sort: PatientSort
  onQueryChange: (value: string) => void
  onSortChange: (value: PatientSort) => void
}) {
  return (
    <div className="mb-5 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
        <input
          type="text"
          placeholder="Tìm theo tên, SĐT, email..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-hairline bg-white pl-9 pr-4 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
        />
      </div>
      <SortButton
        value={sort}
        options={PATIENT_SORT_OPTIONS}
        onChange={onSortChange}
        label="Sắp xếp bệnh nhân"
      />
    </div>
  )
}
