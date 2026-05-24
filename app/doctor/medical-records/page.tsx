import { CalendarDays, FileText, Wallet } from "lucide-react"

import { DoctorShell } from "@/components/doctor/DoctorShell"
import { InsightCard } from "@/components/shared/InsightCard"
import { getDoctorMedicalRecords, getServices } from "@/services/clinic.service"
import { formatAppointmentDate, formatVND } from "@/lib/format"
import { DoctorMedicalRecordsClient } from "./DoctorMedicalRecordsClient"

export default async function DoctorMedicalRecordsPage() {
  const [rows, services] = await Promise.all([getDoctorMedicalRecords(), getServices(false)])
  const totalRevenue = rows.reduce(
    (sum, appointment) =>
      sum +
      (appointment.medicalRecord?.treatments.reduce(
        (treatmentSum, treatment) => treatmentSum + treatment.priceAtTime * treatment.quantity,
        0,
      ) ?? 0),
    0,
  )
  const latest = rows
    .slice()
    .sort((a, b) => +new Date(b.appointmentDate) - +new Date(a.appointmentDate))[0]

  return (
    <DoctorShell title="Hồ sơ bệnh án" description={`${rows.length} hồ sơ đã ghi nhận`}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InsightCard
            icon={FileText}
            label="Tổng hồ sơ"
            value={String(rows.length)}
            updatedLabel="Bệnh án"
          />
          <InsightCard
            icon={Wallet}
            label="Tổng dịch vụ"
            value={formatVND(totalRevenue)}
            tone="green"
          />
          <InsightCard
            icon={CalendarDays}
            label="Gần nhất"
            value={latest ? formatAppointmentDate(latest.appointmentDate, "dd/MM/yyyy") : "—"}
            tone="slate"
          />
        </div>

        <DoctorMedicalRecordsClient rows={rows} clinicalServices={services} />
      </div>
    </DoctorShell>
  )
}
