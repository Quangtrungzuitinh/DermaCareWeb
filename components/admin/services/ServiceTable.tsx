"use client"

import { formatVND } from "@/lib/format"
import type { UiService } from "@/services/clinic.types"

export function ServiceTable({
  services,
  total,
  toggleAction,
}: {
  services: UiService[]
  total: number
  toggleAction: (formData: FormData) => Promise<void>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-soft">
            <th className="px-5 py-3 font-medium">Tên dịch vụ</th>
            <th className="px-5 py-3 font-medium">Giá</th>
            <th className="px-5 py-3 font-medium">Thời lượng</th>
            <th className="px-5 py-3 font-medium">30 ngày</th>
            <th className="px-5 py-3 font-medium">Trạng thái</th>
            <th className="px-5 py-3 text-right font-medium">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {total === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-muted">
                Không tìm thấy dịch vụ nào.
              </td>
            </tr>
          ) : (
            services.map((service) => (
              <tr key={service.id} className="border-t border-hairline-soft hover:bg-surface-soft">
                <td className="px-5 py-4 font-medium text-ink">{service.name}</td>
                <td className="px-5 py-4 font-semibold text-ink">{formatVND(service.price)}</td>
                <td className="px-5 py-4 text-[#475569]">{service.durationMinutes} phút</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-[#1e3a8a]">
                    {service.bookingCount30d ?? 0} lịch
                  </span>
                </td>
                <td className="px-5 py-4">
                  {service.isActive ? (
                    <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
                      Đang bật
                    </span>
                  ) : (
                    <span className="rounded-full bg-hairline-soft px-2.5 py-1 text-xs font-semibold text-muted">
                      Đã ẩn
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <form action={toggleAction} className="inline">
                    <input type="hidden" name="id" value={service.id} />
                    <input type="hidden" name="isActive" value={String(service.isActive)} />
                    <button
                      type="submit"
                      className="rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface-card"
                    >
                      {service.isActive ? "Ẩn" : "Bật"}
                    </button>
                  </form>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
