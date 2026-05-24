"use client"

import type { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { RoleShell } from "@/components/shared/RoleShell"

type AdminShellProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  profileName?: string
  profileEmail?: string
}

export function AdminShell({
  title,
  description,
  actions,
  children,
  profileName = "Admin",
  profileEmail = "admin@dermacare.vn",
}: AdminShellProps) {
  return (
    <RoleShell
      title={title}
      description={description}
      actions={actions}
      profileName={profileName}
      profileEmail={profileEmail}
      roleLabel="Quản trị viên"
      notificationsHref="/admin/notifications"
      Sidebar={AdminSidebar}
      avatarBg="#2563eb"
      avatarFg="#ffffff"
    >
      {children}
    </RoleShell>
  )
}
