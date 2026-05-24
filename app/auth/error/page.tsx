import Link from "next/link"
import { Suspense } from "react"
import { AlertCircle } from "lucide-react"

import { AuthShell } from "@/components/auth/AuthShell"

async function ErrorContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams

  return (
    <p className="mt-1 text-sm leading-6 text-[#64748b]">
      {params?.error ?? "Đã xảy ra lỗi không xác định trong quá trình xác thực."}
    </p>
  )
}

export default function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <AuthShell
      title="Không thể xác thực"
      description="Liên kết xác thực không hợp lệ hoặc đã hết hạn."
    >
      <div className="rounded-3xl border border-[#fecaca] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fef2f2] text-[#dc2626]">
            <AlertCircle className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-bold text-[#0f172a]">Xác thực thất bại</h3>
            <Suspense fallback={null}>
              <ErrorContent searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#2563eb] px-4 text-sm font-bold text-white transition hover:bg-[#1d4ed8]"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthShell>
  )
}
