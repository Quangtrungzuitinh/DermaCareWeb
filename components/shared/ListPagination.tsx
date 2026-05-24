"use client"

export type PageSize = 5 | 10 | 20 | 50

export const PAGE_SIZE_OPTIONS: PageSize[] = [5, 10, 20, 50]

export function ListPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "mục",
}: {
  total: number
  page: number
  pageSize: PageSize
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
  itemLabel?: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, total)

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[#eef2f7] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-[#64748b]">
        Hiển thị <span className="font-semibold text-[#0f172a]">{startIndex}</span>
        {" - "}
        <span className="font-semibold text-[#0f172a]">{endIndex}</span>
        {" / "}
        <span className="font-semibold text-[#0f172a]">{total}</span>
        {` ${itemLabel}`}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-[#64748b]" htmlFor="list-page-size">
          Hiển thị
        </label>
        <select
          id="list-page-size"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}
          className="h-9 rounded-full border border-[#e2e8f0] bg-white px-3 text-sm font-semibold text-[#334155] outline-none transition hover:border-[#bfdbfe] hover:bg-[#f8fafc] focus:border-[#2563eb]"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}/trang
            </option>
          ))}
        </select>

        <div className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] p-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#475569] transition hover:bg-white hover:text-[#2563eb] disabled:pointer-events-none disabled:opacity-40"
            aria-label="Trang trước"
          >
            ‹
          </button>
          <span className="min-w-16 px-2 text-center text-sm font-semibold text-[#0f172a]">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#475569] transition hover:bg-white hover:text-[#2563eb] disabled:pointer-events-none disabled:opacity-40"
            aria-label="Trang sau"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
