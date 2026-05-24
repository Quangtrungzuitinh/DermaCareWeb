"use client"

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Menu, Settings } from "lucide-react"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { Initials } from "@/components/shared/InitialsAvatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"

type SidebarProps = {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}

type RoleShellProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  profileName: string
  profileEmail?: string | null
  roleLabel: string
  notificationsHref: string
  Sidebar: ComponentType<SidebarProps>
  settingsHref?: string
  avatarBg?: string
  avatarFg?: string
}

export function RoleShell({
  title,
  description,
  actions,
  children,
  profileName,
  profileEmail,
  roleLabel,
  notificationsHref,
  Sidebar,
  settingsHref,
  avatarBg,
  avatarFg,
}: RoleShellProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen bg-surface-soft">
      <div
        className="sticky top-0 hidden h-screen flex-shrink-0 transition-[width] duration-200 ease-out md:block"
        style={{ width: collapsed ? 76 : 240 }}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-hairline bg-white px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Mở menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-card md:hidden"
                >
                  <Menu className="h-5 w-5 text-ink" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0">
                <Sidebar onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-ink md:text-xl">{title}</h1>
              {description && <p className="truncate text-xs text-muted">{description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <NotificationBell allHref={notificationsHref} />
            <div className="relative" ref={userRef}>
              <button
                type="button"
                aria-label="Tài khoản"
                onClick={() => setDropdownOpen((value) => !value)}
                className="rounded-full transition hover:ring-2 hover:ring-[#e8eef5]"
              >
                <Initials name={profileName} size={36} bg={avatarBg} fg={avatarFg} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[300] min-w-[240px] rounded-xl border border-hairline bg-white p-1.5 shadow-[0_8px_32px_rgba(30,58,95,0.16)]">
                  <div className="mb-1 border-b border-hairline-soft px-3 pb-2.5 pt-2.5">
                    <div className="text-[13px] font-bold text-ink">{profileName}</div>
                    {profileEmail && (
                      <div className="mt-0.5 text-[12px] text-muted">{profileEmail}</div>
                    )}
                    <span className="mt-1.5 inline-block rounded-full bg-[#e8eef5] px-2 py-0.5 text-[11px] font-bold text-navy">
                      {roleLabel}
                    </span>
                  </div>

                  {settingsHref && (
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false)
                        router.push(settingsHref)
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-body transition-colors hover:bg-hairline-soft"
                    >
                      <Settings className="h-[14px] w-[14px] flex-shrink-0" />
                      Cài đặt
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-3 py-2 text-left text-[13px] font-medium text-danger transition-colors hover:bg-[#fef2f2]"
                  >
                    <LogOut className="h-[14px] w-[14px] flex-shrink-0 text-danger" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
