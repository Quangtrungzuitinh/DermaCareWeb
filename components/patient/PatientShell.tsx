"use client"

import type { ReactNode } from "react"
import { PatientSidebar } from "@/components/patient/PatientSidebar"
import { RoleShell } from "@/components/shared/RoleShell"

type PatientShellProps = {
  title: string
  description?: string
  actions?: ReactNode
  profile?: {
    fullName: string
    email?: string | null
  }
  children: ReactNode
}

export function PatientShell({
  title,
  description,
  actions,
  profile,
  children,
}: PatientShellProps) {
  const displayName = profile?.fullName ?? profile?.email ?? "User"

  return (
    <RoleShell
      title={title}
      description={description}
      actions={actions}
      profileName={displayName}
      profileEmail={profile?.email}
      roleLabel="Bệnh nhân"
      notificationsHref="/patient/notifications"
      Sidebar={PatientSidebar}
      settingsHref="/patient/settings"
    >
      {children}
    </RoleShell>
  )
}
