"use client"

import { DoctorApprovalsSection } from "@/components/admin/permissions/DoctorApprovalsSection"
import { UserRolesSection } from "@/components/admin/permissions/UserRolesSection"
import type { UiDoctor, UiProfile } from "@/services/clinic.types"

export function AdminPermissionsClient({
  users,
  pendingDoctors,
  updateRoleAction,
  approveDoctorAction,
  rejectDoctorAction,
}: {
  users: UiProfile[]
  pendingDoctors: UiDoctor[]
  updateRoleAction: (formData: FormData) => Promise<void>
  approveDoctorAction: (formData: FormData) => Promise<void>
  rejectDoctorAction: (formData: FormData) => Promise<void>
}) {
  return (
    <>
      <DoctorApprovalsSection
        pendingDoctors={pendingDoctors}
        approveDoctorAction={approveDoctorAction}
        rejectDoctorAction={rejectDoctorAction}
      />
      <UserRolesSection users={users} updateRoleAction={updateRoleAction} />
    </>
  )
}
