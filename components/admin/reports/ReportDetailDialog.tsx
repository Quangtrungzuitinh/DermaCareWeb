"use client"

import { BarChart3, FileText, Printer, type LucideIcon } from "lucide-react"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getPatientName } from "@/lib/appointment-utils"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import { exportReportPdf, formatInputDate, type ReportRow } from "@/lib/report-utils"

export function ReportDetailDialog({
  report,
  onOpenChange,
}: {
  report: ReportRow | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(report)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-5xl">
        {report && (
          <div className="flex max-h-[92vh] flex-col">
            <div className="border-b border-hairline-muted p-5 pr-12">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl text-ink">
                  <FileText className="h-5 w-5 text-primary" />
                  Báo cáo {formatInputDate(report.from)} - {formatInputDate(report.to)}
                </DialogTitle>
                <DialogDescription>
                  Tạo lúc {formatAppointmentDate(report.createdAt, "HH:mm dd/MM/yyyy")}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ReportMetric
                  icon={BarChart3}
                  label="Tổng lịch"
                  value={String(report.totalAppointments)}
                />
                <ReportMetric label="Hoàn thành" value={String(report.completedAppointments)} />
                <ReportMetric label="Doanh thu cọc" value={formatVND(report.depositRevenue)} />
                <ReportMetric label="Dịch vụ" value={formatVND(report.treatmentRevenue)} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-hairline-muted p-4">
                  <h3 className="text-sm font-semibold text-ink">Trạng thái lịch hẹn</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <StatusLine label="Chờ thanh toán" value={report.pendingAppointments} />
                    <StatusLine label="Đã xác nhận" value={report.confirmedAppointments} />
                    <StatusLine label="Hoàn thành" value={report.completedAppointments} />
                    <StatusLine label="Đã hủy" value={report.cancelledAppointments} />
                    <StatusLine label="Không đến" value={report.noShowAppointments} />
                  </div>
                </section>

                <section className="rounded-2xl border border-hairline-muted p-4">
                  <h3 className="text-sm font-semibold text-ink">Dịch vụ phát sinh</h3>
                  <div className="mt-3 space-y-2">
                    {report.topServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-ink">{service.name}</p>
                          <p className="text-xs text-muted">{service.quantity} lượt</p>
                        </div>
                        <span className="font-semibold text-ink">{formatVND(service.revenue)}</span>
                      </div>
                    ))}
                    {report.topServices.length === 0 && (
                      <p className="text-sm text-muted">
                        Chưa có dịch vụ phát sinh trong khoảng ngày này.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <section className="overflow-hidden rounded-2xl border border-hairline-muted">
                <div className="border-b border-hairline-muted px-4 py-3">
                  <h3 className="text-sm font-semibold text-ink">Lịch hẹn trong báo cáo</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-muted-soft">
                        <th className="px-4 py-3 font-medium">Thời gian</th>
                        <th className="px-4 py-3 font-medium">Bệnh nhân</th>
                        <th className="px-4 py-3 font-medium">Bác sĩ</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                        <th className="px-4 py-3 text-right font-medium">Cọc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.appointments.map((appointment) => (
                        <tr key={appointment.id} className="border-t border-hairline-soft">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                            {formatAppointmentDate(appointment.appointmentDate, "HH:mm dd/MM/yyyy")}
                          </td>
                          <td className="px-4 py-3 text-[#475569]">
                            {getPatientName(appointment)}
                          </td>
                          <td className="px-4 py-3 text-[#475569]">
                            {appointment.doctor.fullName}
                          </td>
                          <td className="px-4 py-3">
                            <AppointmentStatusBadge status={appointment.status} />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-ink">
                            {formatVND(appointment.payment?.amount ?? 0)}
                          </td>
                        </tr>
                      ))}
                      {report.appointments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted">
                            Không có lịch hẹn trong khoảng ngày này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="border-t border-hairline-muted bg-white p-4">
              <button
                type="button"
                onClick={() => exportReportPdf(report)}
                className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-[#1e293b]"
              >
                <Printer className="h-4 w-4" />
                Xuất PDF
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReportMetric({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-hairline-muted p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-soft">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </div>
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
    </div>
  )
}

function StatusLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  )
}
