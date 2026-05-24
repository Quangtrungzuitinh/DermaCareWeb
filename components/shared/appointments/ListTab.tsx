"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CalendarX, Search } from "lucide-react"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { AppointmentDetailDialog } from "@/components/shared/AppointmentDetailDialog"
import { Initials } from "@/components/shared/InitialsAvatar"
import { ListPagination, type PageSize } from "@/components/shared/ListPagination"
import { SortButton } from "@/components/shared/SortButton"
import {
  APPOINTMENT_SORT_OPTIONS,
  buildAppointmentListModel,
  type AppointmentListFilter,
  type AppointmentListSort,
} from "@/components/shared/appointment-list-model"
import { formatAppointmentDate } from "@/lib/format"
import type { UiAppointment, UiService } from "@/services/clinic.types"
import { pal } from "./calendar-utils"

export function ListTab({
  appointments,
  detailBasePath,
  detailNavigation,
  showDoctor,
  allowDetailActions,
  allowClinicalActions,
  allowPresenceConfirmation,
  clinicalServices,
}: {
  appointments: UiAppointment[]
  detailBasePath: string
  detailNavigation: "client" | "dialog"
  showDoctor: boolean
  allowDetailActions: boolean
  allowClinicalActions: boolean
  allowPresenceConfirmation: boolean
  clinicalServices: UiService[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<AppointmentListFilter>("all")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<AppointmentListSort>("date_desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [selected, setSelected] = useState<UiAppointment | null>(null)
  const selectedAppointmentId = searchParams.get("appointmentId")

  useEffect(() => {
    if (detailNavigation !== "dialog" || !selectedAppointmentId) return
    const appointment = appointments.find((item) => item.id === selectedAppointmentId)
    if (appointment) setSelected(appointment)
  }, [appointments, detailNavigation, selectedAppointmentId])

  const openDetail = (appointment: UiAppointment) => {
    setSelected(appointment)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "list")
    params.set("appointmentId", appointment.id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const closeDetail = () => {
    setSelected(null)
    if (!selectedAppointmentId) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete("appointmentId")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const { filterPills, rows } = useMemo(
    () =>
      buildAppointmentListModel({
        appointments,
        filter,
        query,
        sort,
        now: Date.now(),
      }),
    [appointments, filter, query, sort],
  )
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const pageRows = rows.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    setPage(1)
  }, [filter, query, sort, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="bg-white rounded-3xl border border-[#eef2f7] shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex bg-[#f0f4f8] rounded-full p-1">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              className={`h-9 rounded-full px-4 text-xs font-semibold transition whitespace-nowrap ${
                filter === pill.id ? "bg-white shadow-sm text-[#0f172a]" : "text-[#64748b]"
              }`}
            >
              {pill.label}
              <span className={`ml-1 ${filter === pill.id ? "text-[#475569]" : "text-[#94a3b8]"}`}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm bệnh nhân, bác sĩ..."
              className="h-10 w-full rounded-full border border-[#e2e8f0] bg-white pl-10 pr-4 text-sm placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none"
            />
          </div>
          <SortButton
            value={sort}
            options={APPOINTMENT_SORT_OPTIONS}
            onChange={setSort}
            label="Sắp xếp lịch hẹn"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-[#f7f9fc] py-12 text-center">
          <CalendarX className="h-10 w-10 text-[#94a3b8] mx-auto mb-3" />
          <p className="text-sm text-[#64748b]">Không có lịch hẹn phù hợp</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: showDoctor ? 820 : 660 }}>
            <div
              className="grid items-center px-4 py-3 text-[11px] uppercase tracking-wider text-[#94a3b8] font-medium border-b border-[#eef2f7]"
              style={{
                gridTemplateColumns: showDoctor
                  ? "180px 1.2fr 1fr 140px 90px 120px"
                  : "180px 1.4fr 140px 90px 120px",
              }}
            >
              <div>Ngày giờ</div>
              <div>Bệnh nhân</div>
              {showDoctor && <div>Bác sĩ</div>}
              <div>Trạng thái</div>
              <div>Thời lượng</div>
              <div className="text-right">Hành động</div>
            </div>

            <div className="space-y-1.5 pt-1.5">
              {pageRows.map((a) => {
                const p = pal(a.status)
                const name = a.patient?.fullName ?? a.guestName ?? "Khách vãng lai"
                const detailHref = `${detailBasePath}/${a.id}`
                return (
                  <div
                    key={a.id}
                    className="grid items-center bg-white rounded-2xl border border-[#eef2f7] px-4 py-3 hover:shadow-sm transition relative"
                    style={{
                      gridTemplateColumns: showDoctor
                        ? "180px 1.2fr 1fr 140px 90px 120px"
                        : "180px 1.4fr 140px 90px 120px",
                    }}
                  >
                    <span
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                      style={{ background: p.border }}
                    />
                    <div className="pl-2">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: p.bg, color: p.text }}
                      >
                        {formatAppointmentDate(a.appointmentDate, "HH:mm")}
                      </span>
                      <div className="text-xs text-[#64748b] mt-1">
                        {formatAppointmentDate(a.appointmentDate, "dd/MM/yyyy")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Initials name={name} size={32} bg={p.bg} fg={p.text} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#0f172a] truncate">{name}</div>
                        {(a.guestPhone ?? a.patient?.phone) && (
                          <div className="text-xs text-[#94a3b8] truncate">
                            {a.guestPhone ?? a.patient?.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    {showDoctor && (
                      <div className="text-sm text-[#475569] truncate">{a.doctor.fullName}</div>
                    )}
                    <div>
                      <AppointmentStatusBadge status={a.status} />
                    </div>
                    <div className="text-sm text-[#475569]">{a.durationMin ?? 30} phút</div>
                    <div className="flex justify-end">
                      {detailNavigation === "dialog" ? (
                        <button
                          type="button"
                          onClick={() => openDetail(a)}
                          className="inline-flex h-8 items-center rounded-full border border-[#e2e8f0] px-3 text-xs font-semibold text-[#334155] hover:bg-[#f0f4f8] transition"
                        >
                          Chi tiết
                        </button>
                      ) : (
                        <Link
                          href={detailHref}
                          className="inline-flex h-8 items-center rounded-full border border-[#e2e8f0] px-3 text-xs font-semibold text-[#334155] hover:bg-[#f0f4f8] transition"
                        >
                          Chi tiết
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <ListPagination
          total={rows.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="lịch"
        />
      )}

      <AppointmentDetailDialog
        appointment={selected}
        allowActions={allowDetailActions}
        allowClinicalActions={allowClinicalActions}
        allowPresenceConfirmation={allowPresenceConfirmation}
        clinicalServices={clinicalServices}
        onOpenChange={(open) => {
          if (!open) closeDetail()
        }}
      />
    </div>
  )
}
