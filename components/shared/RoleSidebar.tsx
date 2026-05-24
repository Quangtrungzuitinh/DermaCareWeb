"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { ChevronLeft, ChevronRight, Stethoscope } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type RoleNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

type RoleSidebarProps = {
  primaryItems: RoleNavItem[]
  secondaryItems?: RoleNavItem[]
  secondaryLabel?: string
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function RoleSidebar({
  primaryItems,
  secondaryItems = [],
  secondaryLabel = "Tài khoản",
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: RoleSidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={100}>
      <aside className="flex h-full flex-col border-r border-hairline bg-surface-soft">
        <div
          className={`flex h-[60px] items-center border-b border-hairline ${
            collapsed ? "justify-center px-2" : "justify-between gap-2 px-4"
          }`}
        >
          {collapsed ? (
            <CollapsedBrand onToggleCollapse={onToggleCollapse} />
          ) : (
            <>
              <Brand />
              {onToggleCollapse && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onToggleCollapse}
                      className="hidden h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-card hover:text-primary md:inline-flex"
                      aria-label="Thu gọn menu"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Thu gọn</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          <NavGroup
            items={primaryItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />

          {secondaryItems.length > 0 && (
            <div className="mt-4 border-t border-hairline pt-3">
              {!collapsed && (
                <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-soft">
                  {secondaryLabel}
                </div>
              )}
              <NavGroup
                items={secondaryItems}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            </div>
          )}
        </nav>
      </aside>
    </TooltipProvider>
  )
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary">
        <Stethoscope className="h-5 w-5 text-white" />
      </div>
      <div className="truncate font-bold tracking-tight text-ink">DermaCare</div>
    </div>
  )
}

function CollapsedBrand({ onToggleCollapse }: { onToggleCollapse?: () => void }) {
  if (!onToggleCollapse) {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary">
        <Stethoscope className="h-5 w-5 text-white" />
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Mở menu"
          className="group relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary transition hover:border hover:border-hairline hover:bg-white hover:shadow-sm"
        >
          <Stethoscope className="h-5 w-5 text-white group-hover:hidden" />
          <ChevronRight className="hidden h-4 w-4 text-primary group-hover:block" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">Mở menu</TooltipContent>
    </Tooltip>
  )
}

function NavGroup({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: RoleNavItem[]
  pathname: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const link = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:bg-white hover:text-primary hover:shadow-sm"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        )

        if (!collapsed) return link

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </>
  )
}
