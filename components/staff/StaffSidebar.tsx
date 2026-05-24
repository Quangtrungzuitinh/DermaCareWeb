"use client"

import {
  BarChart3,
  Bell,
  CalendarCheck,
  HelpCircle,
  LayoutDashboard,
  Settings,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react"
import { RoleSidebar } from "@/components/shared/RoleSidebar"

const primaryItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/staff/dashboard" },
  { label: "Lịch hẹn", icon: CalendarCheck, href: "/staff/appointments" },
  { label: "Thanh toán", icon: Wallet, href: "/staff/payments" },
  { label: "Bệnh nhân", icon: Users, href: "/staff/patients" },
  { label: "Báo cáo", icon: BarChart3, href: "/staff/reports" },
  { label: "Thông báo", icon: Bell, href: "/staff/notifications" },
]

const secondaryItems = [
  { label: "Hồ sơ cá nhân", icon: UserCircle, href: "/staff/profile" },
  { label: "Cài đặt", icon: Settings, href: "/staff/settings" },
  { label: "Trợ giúp", icon: HelpCircle, href: "/help" },
]

type StaffSidebarProps = {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function StaffSidebar(props: StaffSidebarProps) {
  return <RoleSidebar primaryItems={primaryItems} secondaryItems={secondaryItems} {...props} />
}
