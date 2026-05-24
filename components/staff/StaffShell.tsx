"use client"

import type { ReactNode } from "react"
import { RoleShell } from "@/components/shared/RoleShell"
import { StaffSidebar } from "@/components/staff/StaffSidebar"

type StaffShellProps = {
  title: string
  description?: string
  actions?: ReactNode
  profileName?: string
  profileEmail?: string
  children: ReactNode
}

export function StaffShell({
  title,
  description,
  actions,
  profileName = "Nhân viên",
  profileEmail = "staff@dermacare.vn",
  children,
}: StaffShellProps) {
  return (
    <RoleShell
      title={title}
      description={description}
      actions={actions}
      profileName={profileName}
      profileEmail={profileEmail}
      roleLabel="Nhân viên"
      notificationsHref="/staff/notifications"
      Sidebar={StaffSidebar}
    >
      {children}
    </RoleShell>
  )
}
