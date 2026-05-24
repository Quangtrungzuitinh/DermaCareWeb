'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { AppointmentStatus } from '@/lib/generated/prisma'

type StatusBreakdownItem = {
  status: Extract<AppointmentStatus, 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'>
  label: string
  count: number
  color: string
}

export type DashboardStats = {
  totalRevenue: number
  cancelRate: number
  noShowRate: number
  totalAppointments: number
  completedAppointments: number
  statusBreakdown: StatusBreakdownItem[]
}

export type RevenueChartPoint = {
  month: string
  revenue: number
}

export type TopDoctor = {
  doctorId: string
  name: string
  specialty: string | null
  appointmentCount: number
}

type RevenueRow = {
  total: bigint | number | string | null
}

type MonthlyRevenueRow = {
  month: string
  revenue: bigint | number | string | null
}

const STATUS_META: Record<StatusBreakdownItem['status'], { label: string; color: string }> = {
  CONFIRMED: { label: 'Đã xác nhận', color: '#d97706' },
  CANCELLED: { label: 'Đã hủy', color: '#dc2626' },
  COMPLETED: { label: 'Hoàn thành', color: '#16a34a' },
}

function toNumber(value: bigint | number | string | null | undefined) {
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return 0
}

async function requireAdminProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('UNAUTHORIZED')

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: {
      id: true,
      fullName: true,
      role: true,
      doctorProfile: { select: { id: true } },
    },
  })

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('FORBIDDEN: Chỉ ADMIN được xem Analytics Dashboard')
  }

  return profile
}

async function getTotalTreatmentRevenue() {
  const rows = await prisma.$queryRaw<RevenueRow[]>`
    SELECT COALESCE(SUM(t."priceAtTime" * t."quantity"), 0) AS total
    FROM "treatments" t
    INNER JOIN "medical_records" mr ON mr."id" = t."medicalRecordId"
    INNER JOIN "appointments" a ON a."id" = mr."appointmentId"
    WHERE a."status" = 'COMPLETED'
  `

  return toNumber(rows[0]?.total)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdminProfile()

  const [
    totalRevenue,
    totalAppointments,
    cancelledAppointments,
    noShowAppointments,
    completedAppointments,
    confirmedAppointments,
  ] = await Promise.all([
    getTotalTreatmentRevenue(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'CANCELLED' } }),
    prisma.appointment.count({ where: { status: 'NO_SHOW' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
  ])

  const rateBase = totalAppointments || 1

  return {
    totalRevenue,
    cancelRate: Number(((cancelledAppointments / rateBase) * 100).toFixed(1)),
    noShowRate: Number(((noShowAppointments / rateBase) * 100).toFixed(1)),
    totalAppointments,
    completedAppointments,
    statusBreakdown: [
      { status: 'CONFIRMED', count: confirmedAppointments, ...STATUS_META.CONFIRMED },
      { status: 'CANCELLED', count: cancelledAppointments, ...STATUS_META.CANCELLED },
      { status: 'COMPLETED', count: completedAppointments, ...STATUS_META.COMPLETED },
    ],
  }
}

export async function getRevenueChartData(): Promise<RevenueChartPoint[]> {
  await requireAdminProfile()

  const rows = await prisma.$queryRaw<MonthlyRevenueRow[]>`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', NOW()) - INTERVAL '11 months',
        date_trunc('month', NOW()),
        INTERVAL '1 month'
      ) AS month_start
    )
    SELECT
      to_char(months.month_start, 'MM/YYYY') AS month,
      COALESCE(SUM(
        CASE
          WHEN a."id" IS NOT NULL THEN t."priceAtTime" * t."quantity"
          ELSE 0
        END
      ), 0) AS revenue
    FROM months
    LEFT JOIN "treatments" t
      ON date_trunc('month', t."createdAt") = months.month_start
    LEFT JOIN "medical_records" mr
      ON mr."id" = t."medicalRecordId"
    LEFT JOIN "appointments" a
      ON a."id" = mr."appointmentId" AND a."status" = 'COMPLETED'
    GROUP BY months.month_start
    ORDER BY months.month_start ASC
  `

  return rows.map((row) => ({
    month: row.month,
    revenue: toNumber(row.revenue),
  }))
}

export async function getTopDoctors(): Promise<TopDoctor[]> {
  await requireAdminProfile()

  const topDoctorGroups = await prisma.appointment.groupBy({
    by: ['doctorId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  })

  if (topDoctorGroups.length === 0) return []

  const doctors = await prisma.doctorProfile.findMany({
    where: { id: { in: topDoctorGroups.map((item) => item.doctorId) } },
    include: { profile: true },
  })
  const doctorById = new Map(doctors.map((doctor) => [doctor.id, doctor]))

  return topDoctorGroups.map((item) => {
    const doctor = doctorById.get(item.doctorId)

    return {
      doctorId: item.doctorId,
      name: doctor?.profile?.fullName ? `BS. ${doctor.profile.fullName}` : 'Bác sĩ đã ngừng hoạt động',
      specialty: doctor?.specialty ?? null,
      appointmentCount: item._count.id,
    }
  })
}
