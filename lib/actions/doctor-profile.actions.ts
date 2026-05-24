"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth/require-role"
import { prisma } from "@/lib/prisma"
import { DoctorLevel } from "@/lib/generated/prisma"
import { sendNotification } from "@/services/notification.service"

const LEVELS = new Set<DoctorLevel>([
  DoctorLevel.FRESHER,
  DoctorLevel.JUNIOR,
  DoctorLevel.SENIOR,
  DoctorLevel.SPECIALIST,
  DoctorLevel.CONSULTANT,
])

export type DoctorProfileActionState = {
  ok: boolean
  message: string | null
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  )
}

export async function completeDoctorProfile(
  _previousState: DoctorProfileActionState,
  formData: FormData,
): Promise<DoctorProfileActionState> {
  const { profile } = await requireRole(["DOCTOR"])
  if (!profile.doctorProfile) {
    return { ok: false, message: "Chưa tìm thấy hồ sơ bác sĩ. Vui lòng liên hệ admin." }
  }
  if (profile.doctorProfile.approvalStatus === "APPROVED") {
    return { ok: false, message: "Hồ sơ đã được duyệt, không thể chỉnh sửa lại." }
  }

  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim()
  const specialty = String(formData.get("specialty") ?? "").trim()
  const seniorityLevel = String(formData.get("seniorityLevel") ?? "JUNIOR") as DoctorLevel

  if (!licenseNumber) return { ok: false, message: "Vui lòng nhập mã giấy phép hành nghề." }
  if (!specialty) return { ok: false, message: "Vui lòng nhập chuyên khoa." }
  if (!LEVELS.has(seniorityLevel)) return { ok: false, message: "Cấp độ chuyên môn không hợp lệ." }

  const duplicateLicense = await prisma.doctorProfile.findFirst({
    where: {
      licenseNumber,
      profileId: { not: profile.id },
    },
    select: { id: true },
  })
  if (duplicateLicense) {
    return {
      ok: false,
      message: "Mã giấy phép này đã được dùng bởi bác sĩ khác. Vui lòng kiểm tra lại.",
    }
  }

  try {
    await prisma.doctorProfile.update({
      where: { profileId: profile.id },
      data: {
        licenseNumber,
        specialty,
        seniorityLevel,
        isActive: false,
        approvalStatus: "SUBMITTED",
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Mã giấy phép này đã được dùng bởi bác sĩ khác. Vui lòng kiểm tra lại.",
      }
    }
    throw error
  }

  const admins = await prisma.profile.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  })

  try {
    await Promise.all(
      admins.map((admin) =>
        sendNotification({
          recipientId: admin.id,
          senderId: profile.id,
          type: "SYSTEM",
          title: "Hồ sơ bác sĩ cần duyệt",
          body: `${profile.fullName} đã gửi thông tin chuyên môn. Vui lòng kiểm tra và duyệt trong Phân quyền.`,
          metadata: {
            href: "/admin/permissions?section=doctor-approvals",
            doctorProfileId: profile.doctorProfile?.id,
            profileId: profile.id,
          },
        }),
      ),
    )
  } catch {
    // Notification table may not be migrated yet; profile submission must still succeed.
  }

  revalidatePath("/admin/permissions")
  revalidatePath("/doctor")
  revalidatePath("/doctor/onboarding")
  return { ok: true, message: "Đã gửi hồ sơ chuyên môn. Vui lòng chờ admin duyệt." }
}
