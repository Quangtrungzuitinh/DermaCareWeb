import { AdminShell } from "@/components/admin/AdminShell"
import { InsightCard } from "@/components/shared/InsightCard"
import { getDoctorSchedule, getDoctors } from "@/services/clinic.service"
import { requireRole } from "@/lib/auth/require-role"
import { CalendarClock, Star, Stethoscope } from "lucide-react"
import { AdminDoctorsClient } from "./AdminDoctorsClient"

export default async function AdminDoctorsPage() {
  const { profile } = await requireRole(["ADMIN"])
  const doctors = await getDoctors()
  const scheduleEntries = await Promise.all(
    doctors.map(async (doctor) => {
      const schedule = await getDoctorSchedule(doctor.id)
      return [doctor.id, schedule.rules] as const
    }),
  )
  const schedules = Object.fromEntries(scheduleEntries)

  const active = doctors.filter((d) => d.isActive)
  const specialties = new Set(doctors.map((d) => d.specialty).filter(Boolean))

  return (
    <AdminShell
      title="Bác sĩ"
      description="Theo dõi đội ngũ bác sĩ và cấu hình lịch làm việc"
      profileName={profile.fullName}
    >
      <div className="space-y-5">
        {/* InsightCards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InsightCard
            icon={Stethoscope}
            label="Tổng bác sĩ"
            value={String(doctors.length)}
            tone="blue"
          />
          <InsightCard
            icon={Star}
            label="Đang hoạt động"
            value={String(active.length)}
            tone="green"
          />
          <InsightCard
            icon={CalendarClock}
            label="Chuyên khoa"
            value={String(specialties.size)}
            tone="slate"
          />
        </div>

        <AdminDoctorsClient doctors={doctors} schedules={schedules} />
      </div>
    </AdminShell>
  )
}
