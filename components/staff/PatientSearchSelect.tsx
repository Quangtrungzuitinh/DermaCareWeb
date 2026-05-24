"use client"

import { useMemo, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { PATIENT_SEARCH_INITIAL_LIMIT, PATIENT_SEARCH_RESULT_LIMIT } from "@/lib/constants"

export interface PatientOption {
  id: string
  fullName: string
  phone: string | null
  email: string | null
}

export function PatientSearchSelect({
  patients,
  value,
  onChange,
}: {
  patients: PatientOption[]
  value: PatientOption | null
  onChange: (patient: PatientOption | null) => void
}) {
  const [query, setQuery] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients.slice(0, PATIENT_SEARCH_INITIAL_LIMIT)
    return patients
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          (p.phone ?? "").includes(q) ||
          (p.email ?? "").toLowerCase().includes(q),
      )
      .slice(0, PATIENT_SEARCH_RESULT_LIMIT)
  }, [query, patients])

  function selectPatient(p: PatientOption) {
    onChange(p)
    setQuery("")
    setDropdownOpen(false)
  }

  function clearPatient() {
    onChange(null)
    setQuery("")
    setTimeout(() => searchRef.current?.focus(), 0)
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary bg-[#eff6ff] px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{value.fullName}</div>
          <div className="mt-0.5 truncate text-xs text-muted">
            {[value.phone, value.email].filter(Boolean).join(" · ") || "Chưa có liên hệ"}
          </div>
        </div>
        <button
          type="button"
          onClick={clearPatient}
          className="shrink-0 rounded-full p-1 hover:bg-primary-light text-primary"
          aria-label="Xóa lựa chọn"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
      <input
        ref={searchRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setDropdownOpen(true)
        }}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
        placeholder="Tìm theo tên, SĐT hoặc email..."
        className="h-11 w-full rounded-xl border border-hairline bg-white pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
      />
      {dropdownOpen && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-hairline bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">Không tìm thấy bệnh nhân phù hợp.</div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => selectPatient(p)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-soft border-b border-hairline-soft last:border-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-[#1e3a8a]">
                  {p.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">{p.fullName}</div>
                  <div className="truncate text-xs text-muted">
                    {[p.phone, p.email].filter(Boolean).join(" · ") || "Chưa có liên hệ"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
