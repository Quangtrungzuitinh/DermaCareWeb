"use client"

import Link from "next/link"

interface RouteErrorStateProps {
  error: Error & { digest?: string }
  reset: () => void
  homeHref?: string
}

export function RouteErrorState({ error, reset, homeHref = "/" }: RouteErrorStateProps) {
  return (
    <div className="flex min-h-[420px] items-center justify-center bg-[#f7f9fc] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#64748b]">
          Có lỗi xảy ra
        </p>
        <h1 className="mt-2 text-xl font-bold text-[#0f172a]">Không thể tải nội dung</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, hãy quay lại trang chính và thao tác lại.
        </p>

        {error.digest && <p className="mt-3 text-xs text-[#94a3b8]">Mã lỗi: {error.digest}</p>}

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            Thử lại
          </button>
          <Link
            href={homeHref}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#e2e8f0] bg-white px-5 text-sm font-semibold text-[#334155] transition hover:bg-[#f7f9fc]"
          >
            Về trang chính
          </Link>
        </div>
      </div>
    </div>
  )
}
