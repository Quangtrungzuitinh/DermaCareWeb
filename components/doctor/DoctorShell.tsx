"use client"

import type { ReactNode } from "react"
import { DoctorSidebar } from "@/components/doctor/DoctorSidebar"
import { RoleShell } from "@/components/shared/RoleShell"

type DoctorShellProps = {
  title: string
  description?: string
  actions?: ReactNode
  profileName?: string
  profileEmail?: string
  children: ReactNode
}

export function DoctorShell({
  title,
  description,
  actions,
  profileName = "Bác sĩ",
  profileEmail = "doctor@dermacare.vn",
  children,
}: DoctorShellProps) {
  return (
    <RoleShell
      title={title}
      description={description}
      actions={actions}
      profileName={profileName}
      profileEmail={profileEmail}
      roleLabel="Bác sĩ"
      notificationsHref="/doctor/notifications"
      Sidebar={DoctorSidebar}
    >
      {children}
    </RoleShell>
  )
}
