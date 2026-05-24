"use client"

import { ArrowDownUp, Check } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type SortOption<T extends string = string> = {
  value: T
  label: string
}

export function SortButton<T extends string>({
  value,
  options,
  onChange,
  label = "Sắp xếp",
}: {
  value: T
  options: SortOption<T>[]
  onChange: (value: T) => void
  label?: string
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3.5 text-sm font-semibold text-[#334155] transition hover:border-[#bfdbfe] hover:bg-[#dbeafe] hover:text-[#2563eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/30"
          aria-label={label}
        >
          <ArrowDownUp className="h-4 w-4" />
          <span className="hidden md:inline">{selected?.label ?? label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-44 rounded-2xl border-[#e2e8f0] bg-white p-1.5"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[#334155] focus:bg-[#eff6ff] focus:text-[#2563eb]"
          >
            {option.label}
            {option.value === value && <Check className="h-4 w-4 text-[#2563eb]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
