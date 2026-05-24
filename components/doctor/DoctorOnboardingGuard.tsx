"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { BadgeCheck, ClipboardList, Stethoscope } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { completeDoctorProfile } from "@/lib/actions/doctor-profile.actions"
import type { ApprovalStatus, DoctorLevel } from "@/lib/generated/prisma"

const LEVEL_OPTIONS: { value: DoctorLevel; label: string }[] = [
  { value: "FRESHER", label: "Fresher" },
  { value: "JUNIOR", label: "Junior" },
  { value: "SENIOR", label: "Senior" },
  { value: "SPECIALIST", label: "Chuyên khoa" },
  { value: "CONSULTANT", label: "Tư vấn" },
]

type DoctorProfileSnapshot = {
  id: string
  licenseNumber: string
  seniorityLevel: DoctorLevel
  specialty: string | null
  isActive: boolean
  approvalStatus: ApprovalStatus
}

export function DoctorOnboardingGuard({
  needsOnboarding,
  profileName,
  profileEmail,
  doctorProfile,
  children,
}: {
  needsOnboarding: boolean
  profileName: string
  profileEmail: string | null
  doctorProfile: DoctorProfileSnapshot | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(needsOnboarding)
  const [formState, formAction, isPending] = useActionState(completeDoctorProfile, {
    ok: false,
    message: null,
  })
  const approvalStatus = doctorProfile?.approvalStatus ?? "PENDING"
  const hasSubmittedProfile = approvalStatus === "SUBMITTED"
  const isRejected = approvalStatus === "REJECTED"

  useEffect(() => {
    setOpen(needsOnboarding)
  }, [needsOnboarding])

  useEffect(() => {
    if (needsOnboarding && searchParams.get("onboarding") === "1") {
      setOpen(true)
    }
  }, [needsOnboarding, searchParams])

  useEffect(() => {
    if (formState.ok) router.refresh()
  }, [formState.ok, router])

  return (
    <>
      {children}
      <Dialog open={open && needsOnboarding} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="max-h-[92vh] overflow-y-auto rounded-3xl border-hairline-muted bg-white p-0 shadow-[0_18px_60px_rgba(15,23,42,0.16)] sm:max-w-3xl"
        >
          <div className="border-b border-hairline-muted bg-surface-soft px-6 py-5">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-bold text-ink">
                Hoàn thiện hồ sơ bác sĩ
              </DialogTitle>
              <DialogDescription className="text-muted">
                Tài khoản đã được promote lên bác sĩ. Cần hoàn tất thông tin chuyên môn và chờ admin
                duyệt.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 p-6 lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="space-y-4">
              <div className="rounded-3xl border border-hairline-muted bg-white p-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-ink">{profileName}</h2>
                <p className="mt-1 text-sm text-muted">{profileEmail ?? "Chưa có email"}</p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Hệ thống đã tạo hồ sơ bác sĩ tạm thời. Sau khi nhập chuyên môn, admin sẽ nhận
                  thông báo để duyệt.
                </p>
              </div>

              <div className="rounded-3xl border border-hairline-muted bg-white p-5">
                <h3 className="text-sm font-semibold text-ink">Trạng thái</h3>
                <div className="mt-4 space-y-3">
                  <Step
                    icon={ClipboardList}
                    label="DoctorProfile đã tạo"
                    done={Boolean(doctorProfile)}
                    spinning={isPending}
                  />
                  <Step
                    icon={BadgeCheck}
                    label="Giấy phép hành nghề"
                    done={Boolean(
                      doctorProfile?.licenseNumber &&
                      !doctorProfile.licenseNumber.startsWith("PENDING-"),
                    )}
                    spinning={isPending}
                  />
                  <Step
                    icon={Stethoscope}
                    label="Chuyên khoa"
                    done={Boolean(doctorProfile?.specialty)}
                    spinning={isPending}
                  />
                  <Step
                    icon={BadgeCheck}
                    label="Admin duyệt hồ sơ"
                    done={approvalStatus === "APPROVED"}
                    spinning={isPending}
                  />
                </div>
              </div>
            </aside>

            {hasSubmittedProfile ? (
              <section className="rounded-3xl border border-[#bfdbfe] bg-white p-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-ink">Đang chờ admin duyệt</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Hồ sơ chuyên môn đã được gửi lên hệ thống. Khi admin duyệt, bạn sẽ nhận
                  notification và popup này sẽ không còn xuất hiện.
                </p>
                <div className="mt-5 grid gap-3 rounded-2xl bg-surface-soft p-4 text-sm md:grid-cols-3">
                  <Info label="Mã bác sĩ" value={doctorProfile?.id ?? "-"} />
                  <Info label="Giấy phép" value={doctorProfile?.licenseNumber ?? "-"} />
                  <Info label="Chuyên khoa" value={doctorProfile?.specialty ?? "-"} />
                </div>
              </section>
            ) : (
              <form
                action={formAction}
                className="rounded-3xl border border-hairline-muted bg-white p-5"
              >
                {isRejected && (
                  <div className="mb-5 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                    <span className="font-semibold">Hồ sơ bị từ chối.</span> Vui lòng kiểm tra thông
                    báo để biết lý do, chỉnh sửa và gửi lại.
                  </div>
                )}
                <div className="mb-5">
                  <h2 className="text-lg font-semibold tracking-tight text-ink">
                    Thông tin chuyên môn
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Các thông tin này sẽ hiển thị trên lịch khám, hồ sơ bệnh án và trang đặt lịch
                    sau khi admin duyệt.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Mã giấy phép hành nghề" required>
                    <input
                      name="licenseNumber"
                      required
                      defaultValue={
                        doctorProfile?.licenseNumber?.startsWith("PENDING-")
                          ? ""
                          : (doctorProfile?.licenseNumber ?? "")
                      }
                      placeholder="VD: CCHN-012345"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Cấp độ chuyên môn" required>
                    <select
                      name="seniorityLevel"
                      required
                      defaultValue={doctorProfile?.seniorityLevel ?? "JUNIOR"}
                      className={inputClass}
                    >
                      {LEVEL_OPTIONS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Chuyên khoa" required>
                      <input
                        name="specialty"
                        required
                        defaultValue={doctorProfile?.specialty ?? ""}
                        placeholder="VD: Da liễu thẩm mỹ, Laser & Trẻ hóa"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>

                <div className="mt-6 border-t border-hairline-muted pt-5">
                  {formState.message && (
                    <div
                      className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        formState.ok
                          ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
                          : "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
                      }`}
                    >
                      {formState.message}
                    </div>
                  )}
                  <SubmitButton disabled={!doctorProfile} />
                  {!doctorProfile && (
                    <p className="mt-2 text-xs text-danger">
                      Chưa tìm thấy DoctorProfile. Vui lòng liên hệ admin để promote lại tài khoản.
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

const inputClass =
  "h-11 w-full rounded-xl border border-hairline bg-white px-3 text-sm text-ink placeholder:text-muted-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Đang gửi..." : "Gửi hồ sơ để admin duyệt"}
    </button>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm text-body">
      <span className="mb-1.5 block font-semibold">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-soft">
        {label}
      </div>
      <div className="mt-1 font-semibold text-ink">{value}</div>
    </div>
  )
}

function Step({
  icon: Icon,
  label,
  done,
  spinning,
}: {
  icon: typeof ClipboardList
  label: string
  done: boolean
  spinning?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-soft p-3">
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
          done ? "bg-[#dcfce7] text-[#166534]" : "bg-hairline-soft text-muted"
        }`}
      >
        <Icon className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
      </span>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span
        className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${
          done ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fef3c7] text-[#92400e]"
        }`}
      >
        {done ? "Xong" : "Cần nhập"}
      </span>
    </div>
  )
}
