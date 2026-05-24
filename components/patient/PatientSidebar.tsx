"use client"

import {
  Bell,
  CalendarCheck,
  Clock,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Settings,
  UserRound,
} from "lucide-react"
import { RoleSidebar } from "@/components/shared/RoleSidebar"

const primaryItems = [
  { label: "Tổng quan", icon: LayoutDashboard, href: "/patient/dashboard" },
  { label: "Lịch hẹn của tôi", icon: CalendarCheck, href: "/patient/appointments" },
  { label: "Bác sĩ của tôi", icon: UserRound, href: "/patient/doctors" },
  { label: "Hồ sơ", icon: FileText, href: "/patient/health-records" },
  { label: "Hàng chờ", icon: Clock, href: "/patient/waitlist" },
  { label: "Thông báo", icon: Bell, href: "/patient/notifications" },
]

const secondaryItems = [
  { label: "Cài đặt", icon: Settings, href: "/patient/settings" },
  { label: "Trung tâm trợ giúp", icon: HelpCircle, href: "/help" },
]

type PatientSidebarProps = {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function PatientSidebar(props: PatientSidebarProps) {
  return <RoleSidebar primaryItems={primaryItems} secondaryItems={secondaryItems} {...props} />
}
