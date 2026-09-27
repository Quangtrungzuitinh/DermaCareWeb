import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

async function fetchCurrentPatient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const profile = await prisma.profile.findUnique({ where: { supabaseUserId: user.id } })
  return profile ? { fullName: profile.fullName, email: profile.email, phone: profile.phone } : null
}

export async function fetchBookingSelectData() {
  const [doctors, services, patient] = await Promise.all([
    prisma.doctorProfile.findMany({
      where: { isActive: true },
      include: {
        profile: true,
        expertiseLabels: { select: { modelCode: true, labelEn: true, labelVi: true } },
        serviceAssignments: { where: { isActive: true }, include: { service: true } },
      },
      orderBy: { profile: { fullName: "asc" } },
    }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    fetchCurrentPatient(),
  ])

  const linkedDoctors = doctors.filter(
    (d): d is typeof d & { profile: NonNullable<typeof d.profile> } => Boolean(d.profile),
  )
  return { linkedDoctors, services, patient }
}

type ConfirmParams = {
  doctorId?: string
  serviceId?: string
  date?: string
  slot?: string
}

export async function fetchBookingConfirmData(params: ConfirmParams) {
  if (!params.doctorId || !params.date || !params.slot) return null

  const [doctor, service, patient] = await Promise.all([
    prisma.doctorProfile.findUnique({ where: { id: params.doctorId }, include: { profile: true } }),
    params.serviceId ? prisma.service.findUnique({ where: { id: params.serviceId } }) : null,
    fetchCurrentPatient(),
  ])

  if (!doctor?.profile) return null
  const narrowedDoctor = doctor as typeof doctor & { profile: NonNullable<typeof doctor.profile> }
  return { doctor: narrowedDoctor, service, patient }
}

export async function fetchBookingPaymentAppointment(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      baseFee: true,
      appointmentDate: true,
      doctor: { include: { profile: true } },
    },
  })
}
