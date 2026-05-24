import { getPatientName } from "@/lib/appointment-utils"
import { APPOINTMENT_STATUS_LABELS } from "@/lib/appointment-status"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import type { AppointmentStatus } from "@/lib/generated/prisma"
import type { UiAppointment, UiService } from "@/services/clinic.types"

export type ReportService = {
  id: string
  name: string
  quantity: number
  revenue: number
}

export type ReportRow = {
  id: string
  from: string
  to: string
  createdAt: string
  appointments: UiAppointment[]
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  confirmedAppointments: number
  pendingAppointments: number
  noShowAppointments: number
  depositRevenue: number
  treatmentRevenue: number
  topServices: ReportService[]
}

export function toDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatInputDate(value: string): string {
  const [year, month, day] = value.split("-")
  return `${day}/${month}/${year}`
}

function getRangeAppointments(appointments: UiAppointment[], from: string, to: string) {
  const start = new Date(`${from}T00:00:00+07:00`).getTime()
  const end = new Date(`${to}T23:59:59+07:00`).getTime()
  return appointments.filter((appointment) => {
    const time = new Date(appointment.appointmentDate).getTime()
    return time >= start && time <= end
  })
}

export function buildReport(
  appointments: UiAppointment[],
  services: UiService[],
  from: string,
  to: string,
): ReportRow {
  const rows = getRangeAppointments(appointments, from, to)
  const serviceMap = new Map<string, ReportService>()

  for (const service of services) {
    serviceMap.set(service.id, { id: service.id, name: service.name, quantity: 0, revenue: 0 })
  }

  for (const appointment of rows) {
    for (const treatment of appointment.medicalRecord?.treatments ?? []) {
      const current = serviceMap.get(treatment.serviceId) ?? {
        id: treatment.serviceId,
        name: treatment.serviceName,
        quantity: 0,
        revenue: 0,
      }
      current.quantity += treatment.quantity
      current.revenue += treatment.quantity * treatment.priceAtTime
      serviceMap.set(treatment.serviceId, current)
    }
  }

  const countStatus = (status: AppointmentStatus) =>
    rows.filter((row) => row.status === status).length
  const topServices = Array.from(serviceMap.values())
    .filter((service) => service.quantity > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return {
    id: `${from}-${to}-${Date.now()}`,
    from,
    to,
    createdAt: new Date().toISOString(),
    appointments: rows,
    totalAppointments: rows.length,
    completedAppointments: countStatus("COMPLETED"),
    cancelledAppointments: countStatus("CANCELLED"),
    confirmedAppointments: countStatus("CONFIRMED"),
    pendingAppointments: countStatus("PENDING_PAYMENT"),
    noShowAppointments: countStatus("NO_SHOW"),
    depositRevenue: rows.reduce((sum, row) => sum + (row.payment?.amount ?? 0), 0),
    treatmentRevenue: topServices.reduce((sum, service) => sum + service.revenue, 0),
    topServices,
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function exportReportPdf(report: ReportRow): void {
  const win = window.open("", "_blank", "noopener,noreferrer")
  if (!win) return

  const appointmentRows = report.appointments
    .map(
      (appointment) => `
        <tr>
          <td>${escapeHtml(formatAppointmentDate(appointment.appointmentDate, "HH:mm dd/MM/yyyy"))}</td>
          <td>${escapeHtml(getPatientName(appointment))}</td>
          <td>${escapeHtml(appointment.doctor.fullName)}</td>
          <td>${escapeHtml(APPOINTMENT_STATUS_LABELS[appointment.status])}</td>
          <td class="right">${escapeHtml(formatVND(appointment.payment?.amount ?? 0))}</td>
        </tr>
      `,
    )
    .join("")

  const serviceRows = report.topServices
    .map(
      (service) => `
        <tr>
          <td>${escapeHtml(service.name)}</td>
          <td class="right">${service.quantity}</td>
          <td class="right">${escapeHtml(formatVND(service.revenue))}</td>
        </tr>
      `,
    )
    .join("")

  win.document.write(`
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Báo cáo ${escapeHtml(formatInputDate(report.from))} - ${escapeHtml(formatInputDate(report.to))}</title>
        <style>
          body { color: #0f172a; font-family: Arial, sans-serif; margin: 32px; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          h2 { font-size: 15px; margin: 28px 0 10px; }
          .muted { color: #64748b; font-size: 12px; }
          .grid { display: grid; gap: 12px; grid-template-columns: repeat(4, 1fr); margin: 22px 0; }
          .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
          .label { color: #64748b; font-size: 11px; text-transform: uppercase; }
          .value { font-size: 18px; font-weight: 700; margin-top: 6px; }
          table { border-collapse: collapse; font-size: 12px; width: 100%; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 9px 8px; text-align: left; }
          th { color: #64748b; font-size: 10px; text-transform: uppercase; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>Báo cáo vận hành</h1>
        <div class="muted">Từ ${escapeHtml(formatInputDate(report.from))} đến ${escapeHtml(formatInputDate(report.to))}</div>
        <div class="grid">
          <div class="card"><div class="label">Tổng lịch</div><div class="value">${report.totalAppointments}</div></div>
          <div class="card"><div class="label">Hoàn thành</div><div class="value">${report.completedAppointments}</div></div>
          <div class="card"><div class="label">Doanh thu cọc</div><div class="value">${escapeHtml(formatVND(report.depositRevenue))}</div></div>
          <div class="card"><div class="label">Dịch vụ</div><div class="value">${escapeHtml(formatVND(report.treatmentRevenue))}</div></div>
        </div>
        <h2>Dịch vụ phát sinh</h2>
        <table>
          <thead><tr><th>Dịch vụ</th><th class="right">Số lượng</th><th class="right">Doanh thu</th></tr></thead>
          <tbody>${serviceRows || `<tr><td colspan="3">Chưa có dịch vụ phát sinh.</td></tr>`}</tbody>
        </table>
        <h2>Lịch hẹn trong báo cáo</h2>
        <table>
          <thead><tr><th>Thời gian</th><th>Bệnh nhân</th><th>Bác sĩ</th><th>Trạng thái</th><th class="right">Cọc</th></tr></thead>
          <tbody>${appointmentRows || `<tr><td colspan="5">Không có lịch hẹn trong khoảng ngày này.</td></tr>`}</tbody>
        </table>
        <script>window.onload = () => window.print()</script>
      </body>
    </html>
  `)
  win.document.close()
}
