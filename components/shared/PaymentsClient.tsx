"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { AppointmentDetailDialog } from "@/components/shared/AppointmentsView"
import { ListPagination, type PageSize } from "@/components/shared/ListPagination"
import { SortButton, type SortOption } from "@/components/shared/SortButton"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import type { UiAppointment } from "@/services/clinic.types"

const SOURCE_LABELS: Record<string, string> = {
  WEBHOOK: "SePay",
  MANUAL: "Thu tay",
}

type PaymentSort = "date_desc" | "date_asc" | "amount_desc" | "patient"

const PAYMENT_SORT_OPTIONS: SortOption<PaymentSort>[] = [
  { value: "date_desc", label: "Mới nhất" },
  { value: "date_asc", label: "Cũ nhất" },
  { value: "amount_desc", label: "Số tiền cao" },
  { value: "patient", label: "Tên bệnh nhân" },
]

export function PaymentsClient({ rows }: { rows: UiAppointment[] }) {
  const [selected, setSelected] = useState<UiAppointment | null>(null)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<PaymentSort>("date_desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = rows.filter((row) => {
      if (!q) return true
      const haystack = [
        row.patient?.fullName,
        row.guestName,
        row.guestPhone,
        row.patient?.phone,
        row.doctor.fullName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })

    return out.sort((a, b) => {
      if (sort === "date_asc") return +new Date(a.appointmentDate) - +new Date(b.appointmentDate)
      if (sort === "amount_desc")
        return (b.payment?.amount ?? b.baseFee) - (a.payment?.amount ?? a.baseFee)
      if (sort === "patient") {
        const name = (a.patient?.fullName ?? a.guestName ?? "").localeCompare(
          b.patient?.fullName ?? b.guestName ?? "",
          "vi",
        )
        if (name !== 0) return name
      }
      return +new Date(b.appointmentDate) - +new Date(a.appointmentDate)
    })
  }, [query, rows, sort])
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => setPage(1), [query, sort, pageSize])

  return (
    <>
      <div className="mb-5 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <input
            type="text"
            placeholder="Tìm bệnh nhân, SĐT, bác sĩ..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 w-full rounded-xl border border-hairline bg-white pl-9 pr-4 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
          />
        </div>
        <SortButton
          value={sort}
          options={PAYMENT_SORT_OPTIONS}
          onChange={setSort}
          label="Sắp xếp giao dịch"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-hairline-muted bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline-muted text-left text-[11px] uppercase tracking-wider text-muted-soft">
                <th className="px-5 py-3 font-medium">Lịch hẹn</th>
                <th className="px-5 py-3 font-medium">Bệnh nhân</th>
                <th className="px-5 py-3 text-right font-medium">Số tiền</th>
                <th className="px-5 py-3 font-medium">Nguồn</th>
                <th className="px-5 py-3 font-medium">Trạng thái lịch</th>
                <th className="px-5 py-3 text-right font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const source = row.payment?.confirmationSource
                return (
                  <tr key={row.id} className="border-t border-hairline-soft hover:bg-surface-soft">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-ink">
                      {formatAppointmentDate(row.appointmentDate, "HH:mm dd/MM/yyyy")}
                    </td>
                    <td className="px-5 py-4 text-[#475569]">
                      {row.patient?.fullName ?? row.guestName ?? "Khách vãng lai"}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-ink">
                      {formatVND(row.payment?.amount ?? row.baseFee)}
                    </td>
                    <td className="px-5 py-4">
                      {source ? (
                        <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
                          {SOURCE_LABELS[source] ?? source}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-soft">Chưa xác nhận</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <AppointmentStatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(row)}
                        className="rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface-card"
                      >
                        {row.payment ? "Xem" : "Xử lý"}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted">
                    {query ? "Không tìm thấy giao dịch phù hợp." : "Chưa có giao dịch nào."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {filtered.length > 0 && (
        <ListPagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="giao dịch"
        />
      )}

      <AppointmentDetailDialog
        appointment={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}
