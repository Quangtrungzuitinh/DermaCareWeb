import { useQuery } from "@tanstack/react-query"
import { getAvailableSlots } from "@/lib/actions/slot.actions"
import type { SlotItem } from "@/types/booking"

export function useAvailableSlots(doctorId: string | null, date: string | null) {
  return useQuery<SlotItem[]>({
    queryKey: ["slots", doctorId, date],
    queryFn: async () => {
      const rawSlots = await getAvailableSlots(doctorId!, new Date(date! + "T00:00:00"))

      // Transform Date[] from server action into SlotItem[]
      return rawSlots.map((slotDate: Date) => {
        const d = new Date(slotDate)
        const hours = d.getHours()
        const minutes = d.getMinutes()
        const startMinute = hours * 60 + minutes
        const endMinute = startMinute + 30 // default 30-min slots

        const startLabel = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
        const endH = Math.floor(endMinute / 60)
        const endM = endMinute % 60
        const endLabel = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`

        return {
          label: `${startLabel} - ${endLabel}`,
          startMinute,
          endMinute,
          available: true, // If it's in the list, it's available
        }
      })
    },
    enabled: !!doctorId && !!date,
    staleTime: 30_000, // 30s — slot co the bi dat boi user khac
  })
}
