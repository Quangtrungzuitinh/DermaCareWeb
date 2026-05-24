"use client"

import { useEffect, useMemo, useState } from "react"
import { type PageSize } from "@/components/shared/ListPagination"
import { type SortOption } from "@/components/shared/SortButton"
import type { UiAppointment, UiProfile } from "@/services/clinic.types"
import { getPatientVisits } from "./patientDirectoryUtils"

export type PatientSort = "newest" | "name" | "last_visit" | "visit_count"

export const PATIENT_SORT_OPTIONS: SortOption<PatientSort>[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "name", label: "Tên A-Z" },
  { value: "last_visit", label: "Lần khám gần nhất" },
  { value: "visit_count", label: "Nhiều lịch nhất" },
]

export function usePatientDirectoryState({
  patients,
  appointments,
}: {
  patients: UiProfile[]
  appointments: UiAppointment[]
}) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<PatientSort>("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [selectedPatient, setSelectedPatient] = useState<UiProfile | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<UiAppointment | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const rows = !q
      ? patients.slice()
      : patients.filter(
          (patient) =>
            patient.fullName.toLowerCase().includes(q) ||
            patient.email?.toLowerCase().includes(q) ||
            patient.phone?.includes(q),
        )

    return rows.sort((a, b) => {
      const visitsA = getPatientVisits(a.id, appointments)
      const visitsB = getPatientVisits(b.id, appointments)
      if (sort === "name") return a.fullName.localeCompare(b.fullName, "vi")
      if (sort === "visit_count") return visitsB.length - visitsA.length
      if (sort === "last_visit") {
        return (
          +new Date(visitsB[0]?.appointmentDate ?? 0) - +new Date(visitsA[0]?.appointmentDate ?? 0)
        )
      }
      return +new Date(b.createdAt) - +new Date(a.createdAt)
    })
  }, [appointments, patients, query, sort])

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => setPage(1), [query, sort, pageSize])

  return {
    filtered,
    page,
    pageRows,
    pageSize,
    query,
    selectedAppointment,
    selectedPatient,
    sort,
    setPage,
    setPageSize,
    setQuery,
    setSelectedAppointment,
    setSelectedPatient,
    setSort,
  }
}
