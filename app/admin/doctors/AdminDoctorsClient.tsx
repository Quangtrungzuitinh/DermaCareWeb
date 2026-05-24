"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, Search } from "lucide-react"
import { Initials } from "@/components/shared/InitialsAvatar"
import { ListPagination, type PageSize } from "@/components/shared/ListPagination"
import { SortButton, type SortOption } from "@/components/shared/SortButton"
import { ScheduleDialog } from "@/components/admin/doctors/ScheduleDialog"
import type { UiDoctor, UiScheduleRule } from "@/services/clinic.types"

const LEVEL_LABELS: Record<string, string> = {
  FRESHER: "Fresher",
  JUNIOR: "Junior",
  SENIOR: "Senior",
  SPECIALIST: "Chuyên khoa",
  CONSULTANT: "Tư vấn",
}

type DoctorSort = "name" | "specialty" | "level" | "active"

const DOCTOR_SORT_OPTIONS: SortOption<DoctorSort>[] = [
  { value: "name", label: "Tên bác sĩ" },
  { value: "specialty", label: "Chuyên khoa" },
  { value: "level", label: "Cấp độ" },
  { value: "active", label: "Đang hoạt động" },
]

interface Props {
  doctors: UiDoctor[]
  schedules: Record<string, UiScheduleRule[]>
}

export function AdminDoctorsClient({ doctors, schedules }: Props) {
  const [selected, setSelected] = useState<UiDoctor | null>(null)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<DoctorSort>("name")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = q
      ? doctors.filter((doctor) => {
          const haystack = [
            doctor.fullName,
            doctor.licenseNumber,
            doctor.specialty,
            doctor.email,
            doctor.phone,
            LEVEL_LABELS[doctor.seniorityLevel] ?? doctor.seniorityLevel,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          return haystack.includes(q)
        })
      : doctors

    return source.slice().sort((a, b) => {
      if (sort === "specialty") return (a.specialty ?? "").localeCompare(b.specialty ?? "", "vi")
      if (sort === "level") {
        return (LEVEL_LABELS[a.seniorityLevel] ?? a.seniorityLevel).localeCompare(
          LEVEL_LABELS[b.seniorityLevel] ?? b.seniorityLevel,
          "vi",
        )
      }
      if (sort === "active") return Number(b.isActive) - Number(a.isActive)
      return a.fullName.localeCompare(b.fullName, "vi")
    })
  }, [doctors, query, sort])

  useEffect(() => {
    setPage(1)
  }, [query, sort, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleDoctors = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên, chuyên khoa, mã giấy phép..."
            className="h-11 w-full rounded-full border border-hairline bg-white pl-9 pr-4 text-sm text-ink placeholder:text-muted-soft shadow-[0_1px_3px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
          />
        </div>
        <SortButton
          value={sort}
          options={DOCTOR_SORT_OPTIONS}
          onChange={setSort}
          label="Sắp xếp bác sĩ"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-hairline-muted bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_140px_160px] items-center bg-surface-soft px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-soft">
              <div>Bác sĩ</div>
              <div>Chuyên khoa</div>
              <div>Cấp độ</div>
              <div>Trạng thái</div>
              <div className="text-right">Lịch làm việc</div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted">
                {query
                  ? "Không tìm thấy bác sĩ phù hợp."
                  : "Chưa có bác sĩ nào. Tạo DoctorProfile trước."}
              </div>
            ) : (
              visibleDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="grid grid-cols-[2fr_1.2fr_1fr_140px_160px] items-center border-b border-hairline-soft px-5 py-4 transition last:border-0 hover:bg-surface-soft"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-light" />
                    <Initials name={doctor.fullName} size={36} bg="#dbeafe" fg="#1e3a8a" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{doctor.fullName}</p>
                      <p className="truncate text-xs text-muted-soft">{doctor.licenseNumber}</p>
                    </div>
                  </div>
                  <div className="truncate text-sm text-[#475569]">{doctor.specialty ?? "—"}</div>
                  <div className="text-sm text-[#475569]">
                    {LEVEL_LABELS[doctor.seniorityLevel] ?? doctor.seniorityLevel}
                  </div>
                  <div>
                    {doctor.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-hairline-soft px-2.5 py-1 text-xs font-semibold text-muted">
                        Ẩn
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelected(doctor)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-4 text-xs font-semibold text-body transition hover:bg-surface-card"
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      Lịch làm việc
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <ListPagination
          total={filtered.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="bác sĩ"
        />
      </div>

      <ScheduleDialog
        doctor={selected}
        rules={selected ? (schedules[selected.id] ?? []) : []}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}
