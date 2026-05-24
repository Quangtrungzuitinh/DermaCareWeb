"use client"

import {
  Bell,
  CalendarCheck,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react"
import { RoleSidebar } from "@/components/shared/RoleSidebar"

const primaryItems = [
  { label: "Tổng quan", icon: LayoutDashboard, href: "/doctor" },
  { label: "Lịch hẹn", icon: CalendarCheck, href: "/doctor/appointments" },
  { label: "Hồ sơ bệnh án", icon: ClipboardList, href: "/doctor/medical-records" },
  { label: "Dịch vụ", icon: Sparkles, href: "/doctor/services" },
  { label: "Thông báo", icon: Bell, href: "/doctor/notifications" },
]

const secondaryItems = [
  { label: "Cài đặt", icon: Settings, href: "/doctor/settings" },
  { label: "Trợ giúp", icon: HelpCircle, href: "/help" },
]

type DoctorSidebarProps = {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function DoctorSidebar(props: DoctorSidebarProps) {
  return <RoleSidebar primaryItems={primaryItems} secondaryItems={secondaryItems} {...props} />
}
