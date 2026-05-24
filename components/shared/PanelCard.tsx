import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function PanelCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-hairline-muted bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-light hover:shadow-elevated",
        className,
      )}
    >
      {children}
    </div>
  )
}
