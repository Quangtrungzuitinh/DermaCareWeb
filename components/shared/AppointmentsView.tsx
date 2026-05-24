"use client"

import { type ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { CalendarDays, List } from "lucide-react"
import { AppointmentDetailDialog } from "@/components/shared/AppointmentDetailDialog"
import type { UiAppointment, UiService } from "@/services/clinic.types"
import { CalendarTab } from "./appointments/CalendarTab"
import { ListTab } from "./appointments/ListTab"

export { AppointmentDetailDialog }

interface Props {
  appointments: UiAppointment[]
  detailBasePath: string
  detailNavigation?: "client" | "dialog"
  actions?: ReactNode
  showDoctor?: boolean
  allowDetailActions?: boolean
  allowClinicalActions?: boolean
  allowPresenceConfirmation?: boolean
  clinicalServices?: UiService[]
}

export function AppointmentsView({
  appointments,
  detailBasePath,
  detailNavigation = "client",
  actions,
  showDoctor = true,
  allowDetailActions = true,
  allowClinicalActions = false,
  allowPresenceConfirmation = false,
  clinicalServices = [],
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") === "list" ? "list" : "calendar"

  const setTab = (tab: "calendar" | "list") => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex bg-[#f0f4f8] rounded-full p-1">
          {(["calendar", "list"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-1.5 h-9 rounded-full px-4 text-sm font-semibold transition ${
                activeTab === t ? "bg-white shadow-sm text-[#0f172a]" : "text-[#64748b]"
              }`}
            >
              {t === "calendar" ? (
                <>
                  <CalendarDays className="h-4 w-4" /> Lịch
                </>
              ) : (
                <>
                  <List className="h-4 w-4" /> Danh sách
                </>
              )}
            </button>
          ))}
        </div>
        {actions}
      </div>

      {activeTab === "calendar" ? (
        <CalendarTab
          appointments={appointments}
          allowDetailActions={allowDetailActions}
          allowClinicalActions={allowClinicalActions}
          allowPresenceConfirmation={allowPresenceConfirmation}
          clinicalServices={clinicalServices}
          showDoctor={showDoctor}
        />
      ) : (
        <ListTab
          appointments={appointments}
          detailBasePath={detailBasePath}
          detailNavigation={detailNavigation}
          showDoctor={showDoctor}
          allowDetailActions={allowDetailActions}
          allowClinicalActions={allowClinicalActions}
          allowPresenceConfirmation={allowPresenceConfirmation}
          clinicalServices={clinicalServices}
        />
      )}
    </div>
  )
}
