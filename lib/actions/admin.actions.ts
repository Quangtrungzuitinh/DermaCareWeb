"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/require-role"
import { DoctorLevel, type Role } from "@/lib/generated/prisma"
import { sendNotification } from "@/services/notification.service"

async function requireAdmin() {
  return requireRole(["ADMIN"])
}

async function generateUniqueDoctorLicense(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()
    const licenseNumber = `PENDING-${suffix}`
    const existing = await tx.doctorProfile.findUnique({ where: { licenseNumber } })
    if (!existing) return licenseNumber
  }

  throw new Error("CANNOT_GENERATE_UNIQUE_DOCTOR_ID")
}

async function generateDoctorProfileId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
) {
  const yearSuffix = String(new Date().getFullYear()).slice(-2)
  const prefix = `doctor_${yearSuffix}`
  const doctorsAssignedThisYear = await tx.doctorProfile.findMany({
    where: { id: { startsWith: prefix } },
    select: { id: true },
  })
  const latestSequence = doctorsAssignedThisYear.reduce((max, doctor) => {
    const sequence = Number(doctor.id.slice(prefix.length))
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max
  }, 0)
  const nextSequence = latestSequence + 1

  if (nextSequence > 9999) throw new Error("DOCTOR_ID_YEAR_SEQUENCE_EXHAUSTED")

  return `${prefix}${String(nextSequence).padStart(4, "0")}`
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  )
}

export async function createService(input: {
  name: string
  price: number
  durationMinutes: number
  description?: string
}) {
  await requireAdmin()
  const service = await prisma.service.create({
    data: {
      name: input.name,
      price: input.price,
      durationMinutes: input.durationMinutes,
      description: input.description || null,
      isActive: true,
    },
  })
  revalidatePath("/admin")
  revalidatePath("/doctor")
  return service
}

export async function updateService(input: {
  id: string
  name?: string
  price?: number
  durationMinutes?: number
  description?: string
  isActive?: boolean
}) {
  await requireAdmin()
  const service = await prisma.service.update({
    where: { id: input.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  })
  revalidatePath("/admin")
  revalidatePath("/doctor")
  return service
}

export async function updateUserRole(input: { profileId: string; role: Role }) {
  const { profile: admin } = await requireAdmin()
  let profile: Awaited<ReturnType<typeof prisma.profile.update>> | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      profile = await prisma.$transaction(async (tx) => {
        const current = await tx.profile.findUnique({
          where: { id: input.profileId },
          include: { doctorProfile: true },
        })

        const updated = await tx.profile.update({
          where: { id: input.profileId },
          data: { role: input.role },
        })

        if (input.role === "DOCTOR") {
          if (current?.role !== "DOCTOR" && current?.doctorProfile) {
            await tx.$executeRaw`
              UPDATE "doctor_profiles"
              SET
                "profileId" = NULL,
                "isActive" = false,
                "updatedAt" = NOW()
              WHERE "id" = ${current.doctorProfile.id}
            `
          }

          if (current?.role !== "DOCTOR" || !current?.doctorProfile) {
            const licenseNumber = await generateUniqueDoctorLicense(tx)
            const doctorProfileId = await generateDoctorProfileId(tx)
            await tx.doctorProfile.create({
              data: {
                id: doctorProfileId!,
                profile: { connect: { id: input.profileId } },
                licenseNumber: licenseNumber!,
                seniorityLevel: DoctorLevel.JUNIOR,
                specialty: null,
                isActive: false,
              },
            })
          }
        }

        if (input.role !== "DOCTOR" && current?.doctorProfile) {
          await tx.$executeRaw`
            UPDATE "doctor_profiles"
            SET
              "profileId" = NULL,
              "isActive" = false,
              "updatedAt" = NOW()
            WHERE "id" = ${current.doctorProfile.id}
          `
        }

        return updated
      })
      break
    } catch (error) {
      if (input.role === "DOCTOR" && isUniqueConstraintError(error) && attempt < 2) continue
      throw error
    }
  }

  if (!profile) throw new Error("ROLE_UPDATE_FAILED")

  try {
    await sendNotification({
      recipientId: profile.id,
      senderId: admin.id,
      type: "SYSTEM",
      title: "Vai trò tài khoản đã được cập nhật",
      body:
        input.role === "DOCTOR"
          ? "Tài khoản của bạn đã được nâng quyền Bác sĩ. Vui lòng hoàn thiện hồ sơ chuyên môn trước khi sử dụng đầy đủ hệ thống."
          : `Tài khoản của bạn đã được cập nhật vai trò ${input.role}. Vui lòng đăng nhập lại nếu giao diện chưa thay đổi.`,
      metadata: {
        role: input.role,
        href:
          input.role === "DOCTOR"
            ? "/doctor?onboarding=1"
            : input.role === "STAFF"
              ? "/staff/dashboard"
              : input.role === "ADMIN"
                ? "/admin/dashboard"
                : "/patient/dashboard",
      },
    })
  } catch {
    // Notification table may not be migrated yet; role update must still succeed.
  }

  revalidatePath("/admin")
  revalidatePath("/admin/permissions")
  revalidatePath("/doctor")
  return profile
}

export async function approveDoctorProfile(input: { profileId: string }) {
  const { profile: admin } = await requireAdmin()
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { profileId: input.profileId },
    include: { profile: true },
  })

  if (!doctorProfile || doctorProfile.profile?.role !== "DOCTOR") {
    throw new Error("DOCTOR_PROFILE_NOT_FOUND")
  }
  if (doctorProfile.approvalStatus !== "SUBMITTED") {
    throw new Error("DOCTOR_PROFILE_NOT_SUBMITTED")
  }

  const updated = await prisma.doctorProfile.update({
    where: { profileId: input.profileId },
    data: { isActive: true, approvalStatus: "APPROVED" },
    include: { profile: true },
  })

  try {
    if (!updated.profileId) throw new Error("DOCTOR_PROFILE_DETACHED")
    await sendNotification({
      recipientId: updated.profileId,
      senderId: admin.id,
      type: "SYSTEM",
      title: "Hồ sơ bác sĩ đã được duyệt",
      body: "Admin đã duyệt hồ sơ chuyên môn của bạn. Bạn có thể sử dụng đầy đủ chức năng bác sĩ.",
      metadata: { href: "/doctor" },
    })
  } catch {
    // Notification table may not be migrated yet; approval must still succeed.
  }

  revalidatePath("/admin/permissions")
  revalidatePath("/doctor")
  revalidatePath("/doctor/onboarding")
  return updated
}

export async function rejectDoctorProfile(input: { profileId: string; reason?: string }) {
  const { profile: admin } = await requireAdmin()
  const reason = input.reason?.trim()
  if (!reason) throw new Error("REJECT_REASON_REQUIRED")

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { profileId: input.profileId },
    include: { profile: true },
  })

  if (!doctorProfile || doctorProfile.profile?.role !== "DOCTOR") {
    throw new Error("DOCTOR_PROFILE_NOT_FOUND")
  }

  const updated = await prisma.doctorProfile.update({
    where: { profileId: input.profileId },
    data: { approvalStatus: "REJECTED", isActive: false },
    include: { profile: true },
  })

  try {
    if (!updated.profileId) throw new Error("DOCTOR_PROFILE_DETACHED")
    await sendNotification({
      recipientId: updated.profileId,
      senderId: admin.id,
      type: "SYSTEM",
      title: "Hồ sơ bác sĩ cần nhập lại",
      body: `Admin chưa duyệt hồ sơ chuyên môn của bạn. Lý do: ${reason}. Vui lòng nhập lại thông tin để gửi duyệt lại.`,
      metadata: { href: "/doctor?onboarding=1", rejectReason: reason },
    })
  } catch {
    // Notification table may not be migrated yet; rejection must still succeed.
  }

  revalidatePath("/admin/permissions")
  revalidatePath("/doctor")
  revalidatePath("/doctor/onboarding")
  return updated
}

export async function createUserProfile(input: {
  fullName: string
  email?: string
  phone?: string
  role: Role
}) {
  await requireAdmin()
  const profile = await prisma.profile.create({
    data: {
      supabaseUserId: `manual-${crypto.randomUUID()}`,
      fullName: input.fullName,
      email: input.email || null,
      phone: input.phone || null,
      role: input.role,
    },
  })
  revalidatePath("/admin")
  return profile
}

export async function updateUserProfile(input: {
  profileId: string
  fullName: string
  email?: string
  phone?: string
  role: Role
}) {
  await requireAdmin()
  const profile = await prisma.profile.update({
    where: { id: input.profileId },
    data: {
      fullName: input.fullName,
      email: input.email || null,
      phone: input.phone || null,
      role: input.role,
    },
  })
  revalidatePath("/admin")
  return { profile, authUpdated: false, passwordUpdated: false }
}

export async function deleteUserProfile(input: { profileId: string }) {
  const { profile } = await requireAdmin()
  if (profile.id === input.profileId) throw new Error("CANNOT_DELETE_SELF")
  const adminCount = await prisma.profile.count({ where: { role: "ADMIN" } })
  const target = await prisma.profile.findUnique({ where: { id: input.profileId } })
  if (target?.role === "ADMIN" && adminCount <= 1) throw new Error("CANNOT_DELETE_LAST_ADMIN")
  await prisma.profile.delete({ where: { id: input.profileId } })
  revalidatePath("/admin")
  return { ok: true, profileId: input.profileId }
}
