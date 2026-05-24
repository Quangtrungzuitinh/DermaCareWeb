"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getPostLoginPath } from "@/lib/auth/role-redirect"
import { createClient, getUserSafely } from "@/lib/supabase/client"

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [dashboardPath, setDashboardPath] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    getUserSafely(supabase)
      .then(async (user) => {
        if (!mounted) return
        if (!user) {
          setDashboardPath(null)
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("supabase_user_id", user.id)
          .single()

        if (mounted) setDashboardPath(getPostLoginPath(profile?.role))
      })
      .catch(() => {
        if (mounted) setDashboardPath(null)
      })
      .finally(() => {
        if (mounted) setAuthChecked(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <nav
      id="mainNav"
      className={`sticky top-0 z-[100] flex items-center justify-between border-b border-hairline px-[5%] transition-all duration-200 ease-in-out ${
        isScrolled ? "h-[56px] bg-white/[0.96]" : "h-[68px] bg-white/[0.92]"
      }`}
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <Link href="/" className="flex items-center gap-[10px]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3v4l3 3-3 3V17a7 7 0 1 1 0-12z" />
          </svg>
        </div>
        <span className="text-[15px] font-bold tracking-[-0.3px] text-ink">DermaCare Clinic</span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {[
          { label: "Dịch vụ", href: "#services" },
          { label: "Bác sĩ", href: "#doctors" },
          { label: "Về chúng tôi", href: "#about" },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="group relative pb-[2px] text-[14px] font-medium text-muted no-underline transition-colors duration-150 hover:text-navy"
          >
            {link.label}
            <span className="absolute bottom-[-2px] left-0 h-[1.5px] w-0 bg-navy transition-all duration-200 ease-in-out group-hover:w-full" />
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {dashboardPath ? (
          <button
            onClick={() => router.push(dashboardPath)}
            className="relative h-9 overflow-hidden rounded-lg border-none bg-navy px-4 text-[14px] font-semibold text-white transition-all duration-150 hover:-translate-y-[1px] hover:bg-navy-dark"
          >
            Chuyển tới dashboard
          </button>
        ) : (
          <>
            <button
              onClick={() => router.push("/auth/login")}
              className="h-9 rounded-lg border-none bg-transparent px-4 text-[14px] font-semibold text-muted transition-all duration-150 hover:bg-surface-soft hover:text-navy"
            >
              Đăng nhập
            </button>
            <button
              id="btnSignup"
              onClick={() => router.push("/auth/sign-up")}
              className="relative h-9 overflow-hidden rounded-lg border-none bg-navy px-4 text-[14px] font-semibold text-white transition-all duration-150 hover:-translate-y-[1px] hover:bg-navy-dark"
            >
              {authChecked ? "Đăng ký" : "Đang kiểm tra..."}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
