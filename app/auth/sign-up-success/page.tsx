import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { AuthShell } from "@/components/auth/AuthShell"

export default function Page() {
  return (
    <AuthShell
      title="Kiểm tra email xác nhận"
      description="Tài khoản đã được tạo. Vui lòng xác nhận email trước khi đăng nhập."
    >
      <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dcfce7] text-[#16a34a]">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-bold text-[#0f172a]">Đăng ký thành công</h3>
            <p className="mt-1 text-sm leading-6 text-[#64748b]">
              DermaCare đã gửi email xác nhận. Sau khi xác nhận, bạn có thể đăng nhập và đặt lịch
              khám.
            </p>
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
