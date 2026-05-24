"use client"

import { formatAppointmentDate } from "@/lib/format"
import type { UiAppointment, UiProfile } from "@/services/clinic.types"
import { getPatientVisits } from "./patientDirectoryUtils"

export function PatientDirectoryTable({
  appointments,
  patients,
  query,
  total,
  onSelectPatient,
}: {
  appointments: UiAppointment[]
  patients: UiProfile[]
  query: string
  total: number
  onSelectPatient: (patient: UiProfile) => void
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-hairline-muted bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-hairline-muted bg-surface-soft">
          <tr>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              Họ tên
            </th>
            <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted sm:table-cell">
              Email
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              SĐT
            </th>
            <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">
              Lần khám gần nhất
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
              Tổng lịch hẹn
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {patients.map((patient) => {
            const visits = getPatientVisits(patient.id, appointments)
            const lastVisit = visits[0]

            return (
              <tr key={patient.id} className="transition-colors hover:bg-surface-soft">
                <td className="px-5 py-4 font-semibold text-ink">{patient.fullName}</td>
                <td className="hidden px-5 py-4 text-[#475569] sm:table-cell">
                  {patient.email ?? "—"}
                </td>
                <td className="px-5 py-4 text-[#475569]">{patient.phone ?? "—"}</td>
                <td className="hidden px-5 py-4 text-[#475569] md:table-cell">
                  {lastVisit
                    ? formatAppointmentDate(lastVisit.appointmentDate, "dd/MM/yyyy")
                    : "Chưa có"}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="inline-flex items-center rounded-full bg-surface-card px-2.5 py-1 text-xs font-semibold text-body">
                    {visits.length} lịch
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectPatient(patient)}
                    className="rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-body transition-colors hover:bg-surface-card"
                  >
                    Xem hồ sơ
                  </button>
                </td>
              </tr>
            )
          })}
          {total === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted">
                {query ? "Không tìm thấy bệnh nhân phù hợp." : "Chưa có bệnh nhân nào."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
