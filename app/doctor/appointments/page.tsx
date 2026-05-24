import { Suspense } from "react"
import { CalendarCheck2, CheckCircle2, ClipboardList, FileText } from "lucide-react"

import { DoctorShell } from "@/components/doctor/DoctorShell"
import { AppointmentsView } from "@/components/shared/AppointmentsView"
import { InsightCard } from "@/components/shared/InsightCard"
import { formatAppointmentDate } from "@/lib/format"
import { getDoctorAppointments, getServices } from "@/services/clinic.service"

export default async function DoctorAppointmentsPage() {
  const [all, services] = await Promise.all([getDoctorAppointments(), getServices(false)])
  const todayKey = formatAppointmentDate(new Date(), "yyyy-MM-dd")
  const now = Date.now()
  const today = all.filter(
    (appointment) => formatAppointmentDate(appointment.appointmentDate, "yyyy-MM-dd") === todayKey,
  )
  const upcoming = all.filter(
    (appointment) =>
      (appointment.status === "CONFIRMED" || appointment.status === "CHECKED_IN") &&
      +new Date(appointment.appointmentDate) > now,
  )
  const completed = all.filter((appointment) => appointment.status === "COMPLETED")
  const records = all.filter((appointment) => appointment.medicalRecord)

  return (
    <DoctorShell title="Lịch hẹn của tôi" description={`${all.length} lịch hẹn tổng cộng`}>
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            icon={CalendarCheck2}
            label="Hôm nay"
            value={String(today.length)}
            updatedLabel={formatAppointmentDate(new Date(), "dd/MM")}
          />
          <InsightCard
            icon={ClipboardList}
            label="Sắp tới"
            value={String(upcoming.length)}
            updatedLabel="Đã xác nhận"
          />
          <InsightCard
            icon={CheckCircle2}
            label="Hoàn thành"
            value={String(completed.length)}
            tone="green"
          />
          <InsightCard
            icon={FileText}
            label="Có bệnh án"
            value={String(records.length)}
            tone="slate"
          />
        </section>

        <Suspense>
          <AppointmentsView
            appointments={all}
            detailBasePath="/doctor/appointments"
            detailNavigation="dialog"
            showDoctor={false}
            allowDetailActions={false}
            allowClinicalActions
            allowPresenceConfirmation
            clinicalServices={services}
          />
        </Suspense>
      </div>
    </DoctorShell>
  )
}
