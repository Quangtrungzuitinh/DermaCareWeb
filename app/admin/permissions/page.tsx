import { AdminShell } from "@/components/admin/AdminShell"
import { InsightCard } from "@/components/shared/InsightCard"
import { requireRole } from "@/lib/auth/require-role"
import {
  approveDoctorProfile,
  rejectDoctorProfile,
  updateUserRole,
} from "@/lib/actions/admin.actions"
import { getPendingDoctorApprovals, getProfilesByRole } from "@/services/clinic.service"
import { ShieldCheck, Stethoscope, UserCog, Users } from "lucide-react"
import type { Role } from "@/lib/generated/prisma"
import { AdminPermissionsClient } from "./AdminPermissionsClient"

export default async function AdminPermissionsPage() {
  const { profile } = await requireRole(["ADMIN"])
  const [users, pendingDoctors] = await Promise.all([
    getProfilesByRole(),
    getPendingDoctorApprovals(),
  ])

  const counts = {
    PATIENT: users.filter((u) => u.role === "PATIENT").length,
    DOCTOR: users.filter((u) => u.role === "DOCTOR").length,
    STAFF: users.filter((u) => u.role === "STAFF").length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
  }

  async function updateRoleAction(formData: FormData) {
    "use server"
    await updateUserRole({
      profileId: String(formData.get("profileId")),
      role: String(formData.get("role")) as Role,
    })
  }

  async function approveDoctorAction(formData: FormData) {
    "use server"
    await approveDoctorProfile({
      profileId: String(formData.get("profileId")),
    })
  }

  async function rejectDoctorAction(formData: FormData) {
    "use server"
    await rejectDoctorProfile({
      profileId: String(formData.get("profileId")),
      reason: String(formData.get("reason") ?? ""),
    })
  }

  return (
    <AdminShell
      title="Phân quyền"
      description="Thay đổi vai trò tài khoản — mọi thao tác đều chạy qua Server Action có guard ADMIN"
      profileName={profile.fullName}
    >
      <div className="space-y-5">
        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InsightCard icon={Users} label="Bệnh nhân" value={String(counts.PATIENT)} tone="blue" />
          <InsightCard
            icon={Stethoscope}
            label="Bác sĩ"
            value={String(counts.DOCTOR)}
            tone="green"
          />
          <InsightCard icon={UserCog} label="Nhân viên" value={String(counts.STAFF)} tone="amber" />
          <InsightCard
            icon={ShieldCheck}
            label="Quản trị"
            value={String(counts.ADMIN)}
            tone="slate"
          />
        </div>

        <AdminPermissionsClient
          users={users}
          pendingDoctors={pendingDoctors}
          updateRoleAction={updateRoleAction}
          approveDoctorAction={approveDoctorAction}
          rejectDoctorAction={rejectDoctorAction}
        />
      </div>
    </AdminShell>
  )
}
