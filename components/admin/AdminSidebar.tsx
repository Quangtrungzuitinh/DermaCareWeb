"use client"

import {
  BarChart3,
  Bell,
  CalendarCheck,
  LayoutDashboard,
  Sparkles,
  Stethoscope,
  UserCog,
  Users,
  Wallet,
} from "lucide-react"
import { RoleSidebar } from "@/components/shared/RoleSidebar"

const primaryItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Lịch hẹn", href: "/admin/appointments", icon: CalendarCheck },
  { label: "Bệnh nhân", href: "/admin/patients", icon: Users },
  { label: "Bác sĩ", href: "/admin/doctors", icon: Stethoscope },
  { label: "Dịch vụ", href: "/admin/services", icon: Sparkles },
  { label: "Thanh toán", href: "/admin/payments", icon: Wallet },
  { label: "Báo cáo", href: "/admin/reports", icon: BarChart3 },
  { label: "Thông báo", href: "/admin/notifications", icon: Bell },
  { label: "Phân quyền", href: "/admin/permissions", icon: UserCog },
]

type AdminSidebarProps = {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function AdminSidebar(props: AdminSidebarProps) {
  return <RoleSidebar primaryItems={primaryItems} {...props} />
}
