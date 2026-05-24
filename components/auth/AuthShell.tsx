import Link from "next/link"
import type { ReactNode } from "react"
import { CalendarCheck, ShieldCheck, Stethoscope } from "lucide-react"

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="min-h-svh bg-[#f7f9fc] px-4 py-6 text-[#0f172a] md:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[0.95fr_1.05fr]">
          <section className="hidden bg-[#eff6ff] p-8 lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563eb] text-base font-black text-white">
                  D
                </span>
                <span className="text-xl font-extrabold text-[#0f172a]">DermaCare</span>
              </Link>

              <div className="mt-16 max-w-md">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2563eb]">
                  Clinic booking system
                </p>
                <h1 className="mt-3 text-4xl font-black leading-tight text-[#0f172a]">
                  Quản lý lịch khám da liễu rõ ràng và bảo mật.
                </h1>
                <p className="mt-4 text-sm leading-6 text-[#64748b]">
                  Đăng nhập để theo dõi lịch hẹn, hồ sơ khám và các khoản thanh toán trong cùng một
                  hệ thống.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <FeatureRow
                icon={CalendarCheck}
                title="Lịch hẹn"
                text="Theo dõi lịch khám theo ngày và trạng thái."
              />
              <FeatureRow
                icon={Stethoscope}
                title="Hồ sơ khám"
                text="Lưu lại chẩn đoán, ghi chú và dịch vụ điều trị."
              />
              <FeatureRow
                icon={ShieldCheck}
                title="Bảo mật"
                text="Tài khoản được xác thực qua Supabase Auth."
              />
            </div>
          </section>

          <section className="flex min-h-[640px] items-center justify-center p-5 sm:p-8">
            <div className="w-full max-w-[520px]">
              <div className="mb-7 lg:hidden">
                <Link href="/" className="inline-flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563eb] font-black text-white">
                    D
                  </span>
                  <span className="text-lg font-extrabold text-[#0f172a]">DermaCare</span>
                </Link>
              </div>
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2563eb]">
                  DermaCare
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0f172a]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{description}</p>
              </div>
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function FeatureRow({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CalendarCheck
  title: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/75 p-4">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2563eb]">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-sm font-bold text-[#0f172a]">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-[#64748b]">{text}</span>
      </span>
    </div>
  )
}
