import { Suspense } from "react"
import { StaffShell } from "@/components/staff/StaffShell"
import { AppointmentsView } from "@/components/shared/AppointmentsView"
import { BookOnBehalfDialog } from "@/components/staff/BookOnBehalfDialog"
import { getStaffAppointments, getDoctors, getProfilesByRole } from "@/services/clinic.service"

export default async function StaffAppointmentsPage() {
  const [all, doctors, patients] = await Promise.all([
    getStaffAppointments(),
    getDoctors(),
    getProfilesByRole("PATIENT"),
  ])

  return (
    <StaffShell title="Quản lý lịch hẹn" description={`${all.length} lịch hẹn tổng cộng`}>
      <Suspense>
        <AppointmentsView
          appointments={all}
          detailBasePath="/staff/appointments"
          detailNavigation="dialog"
          actions={
            <BookOnBehalfDialog
              key="book-on-behalf"
              doctors={doctors.map((d) => ({
                id: d.id,
                fullName: d.fullName,
                isActive: d.isActive,
              }))}
              patients={patients.map((p) => ({
                id: p.id,
                fullName: p.fullName,
                phone: p.phone,
                email: p.email,
              }))}
            />
          }
        />
      </Suspense>
    </StaffShell>
  )
}
