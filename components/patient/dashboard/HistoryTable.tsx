import { Initials } from "@/components/shared/InitialsAvatar"
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLinkButton } from "@/components/shared/ArrowLinkButton"
import { formatAppointmentDate } from "@/lib/format"
import { formatShortId } from "@/lib/appointment-utils"
import type { PatientDashboardAppointment } from "@/services/patient.types"
import { SoftCard, DARK } from "./DashboardCards"

function PillTab({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="h-10 rounded-xl px-3 text-sm font-medium text-muted data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-sm transition"
    >
      {children}
    </TabsTrigger>
  )
}

function AppointmentTable({ rows }: { rows: PatientDashboardAppointment[] }) {
  if (rows.length === 0) {
    return <div className="px-5 py-12 text-center text-sm text-muted">Không có lịch hẹn</div>
  }
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="bg-surface-soft hover:bg-surface-soft border-b-0">
            <TableHead className="pl-6 text-[11px] text-muted-soft font-semibold uppercase tracking-wider">
              Mã
            </TableHead>
            <TableHead className="text-[11px] text-muted-soft font-semibold uppercase tracking-wider">
              Bác sĩ
            </TableHead>
            <TableHead className="text-[11px] text-muted-soft font-semibold uppercase tracking-wider">
              Lịch khám
            </TableHead>
            <TableHead className="text-[11px] text-muted-soft font-semibold uppercase tracking-wider">
              Trạng thái
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-[#f1f5f9]">
          {rows.map((a) => (
            <TableRow key={a.id} className="hover:bg-surface-soft border-b-0">
              <TableCell className="py-4 pl-6">
                <div className="font-semibold text-ink">#{formatShortId(a.id)}</div>
                <div className="mt-0.5 text-xs text-muted-soft">Lịch hẹn</div>
              </TableCell>
              <TableCell>
                <div className="flex min-w-0 items-center gap-2.5">
                  <Initials name={a.doctor.fullName} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">
                      {a.doctor.fullName}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {a.doctor.specialty ?? "Chuyên khoa chưa cập nhật"}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-semibold text-ink">
                  {formatAppointmentDate(a.appointmentDate, "dd/MM/yyyy")}
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {formatAppointmentDate(a.appointmentDate, "HH:mm")}
                  {a.durationMin ? ` · ${a.durationMin} phút` : ""}
                </div>
              </TableCell>
              <TableCell>
                <AppointmentStatusBadge status={a.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function HistorySection({
  historyRows,
  upcoming,
  completed,
  cancelled,
}: {
  historyRows: PatientDashboardAppointment[]
  upcoming: PatientDashboardAppointment[]
  completed: PatientDashboardAppointment[]
  cancelled: PatientDashboardAppointment[]
}) {
  return (
    <SoftCard className="overflow-hidden">
      <Tabs defaultValue="all" className="flex-col gap-0">
        <div className="space-y-4 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-tight" style={{ color: DARK }}>
              Lịch sử lịch hẹn
            </h3>
            <ArrowLinkButton to="/patient/appointments" label="Mở lịch hẹn" />
          </div>
          <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl bg-hairline-soft p-1">
            <PillTab value="all">Tất cả</PillTab>
            <PillTab value="upcoming">Sắp tới</PillTab>
            <PillTab value="completed">Hoàn thành</PillTab>
            <PillTab value="cancelled">Đã hủy</PillTab>
          </TabsList>
        </div>
        <TabsContent value="all" className="m-0">
          <AppointmentTable rows={historyRows.slice(0, 5)} />
        </TabsContent>
        <TabsContent value="upcoming" className="m-0">
          <AppointmentTable rows={upcoming.slice(0, 5)} />
        </TabsContent>
        <TabsContent value="completed" className="m-0">
          <AppointmentTable rows={completed.slice(0, 5)} />
        </TabsContent>
        <TabsContent value="cancelled" className="m-0">
          <AppointmentTable rows={cancelled.slice(0, 5)} />
        </TabsContent>
      </Tabs>
    </SoftCard>
  )
}
