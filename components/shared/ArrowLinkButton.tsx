"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

function buildHref(to: string, search?: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(search ?? {})) {
    if (value !== undefined) query.set(key, String(value))
  }
  const qs = query.toString()
  return qs ? `${to}?${qs}` : to
}

export function ArrowLinkButton({
  to,
  search,
  label = "Mở trang",
  size = "md",
}: {
  to: string
  search?: Record<string, string | number | boolean | undefined>
  label?: string
  size?: "sm" | "md"
}) {
  const boxSize = size === "sm" ? "h-7 w-7" : "h-8 w-8"
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"

  return (
    <Link
      href={buildHref(to, search)}
      className={`inline-flex ${boxSize} items-center justify-center rounded-full bg-[#f1f5f9] text-[#475569] transition hover:bg-[#dbeafe] hover:text-[#2563eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/30`}
      aria-label={label}
    >
      <ArrowUpRight className={iconSize} />
    </Link>
  )
}
