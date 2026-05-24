"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, Stethoscope, XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { UiDoctor } from "@/services/clinic.types"

type PendingDoctorDecision = {
  doctor: UiDoctor
  action: "approve" | "reject"
} | null

export function DoctorApprovalsSection({
  pendingDoctors,
  approveDoctorAction,
  rejectDoctorAction,
}: {
  pendingDoctors: UiDoctor[]
  approveDoctorAction: (formData: FormData) => Promise<void>
  rejectDoctorAction: (formData: FormData) => Promise<void>
}) {
  const router = useRouter()
  const [pendingDoctorDecision, setPendingDoctorDecision] = useState<PendingDoctorDecision>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [doctorDecisionNotice, setDoctorDecisionNotice] = useState<string | null>(null)
  const [isUpdatingDoctor, startDoctorTransition] = useTransition()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("section") === "doctor-approvals") {
      document
        .getElementById("doctor-approvals")
        ?.scrollIntoView({ block: "start", behavior: "smooth" })
    }
  }, [])

  function confirmDoctorDecision() {
    if (!pendingDoctorDecision) return
    if (pendingDoctorDecision.action === "reject" && !rejectReason.trim()) return
    const formData = new FormData()
    formData.set("profileId", pendingDoctorDecision.doctor.profileId)
    formData.set("reason", rejectReason.trim())
    const action = pendingDoctorDecision.action
    const doctorName = pendingDoctorDecision.doctor.fullName

    startDoctorTransition(async () => {
      if (action === "approve") {
        await approveDoctorAction(formData)
        setDoctorDecisionNotice(
          `Đã duyệt hồ sơ ${doctorName}. Notification đã được gửi cho bác sĩ.`,
        )
      } else {
        await rejectDoctorAction(formData)
        setDoctorDecisionNotice(
          `Đã từ chối hồ sơ ${doctorName}. Bác sĩ sẽ phải nhập lại thông tin.`,
        )
      }
      setPendingDoctorDecision(null)
      setRejectReason("")
      router.refresh()
    })
  }

  return (
    <>
      <section
        id="doctor-approvals"
        className="mb-5 overflow-hidden rounded-3xl border border-hairline-muted bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink">Hồ sơ bác sĩ cần duyệt</h2>
              <p className="text-xs text-muted">
                Bác sĩ đã nhập chuyên môn, admin duyệt để kích hoạt tài khoản.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit rounded-full bg-hairline-soft px-3 py-1 text-xs font-semibold text-[#475569]">
            {pendingDoctors.length} hồ sơ
          </span>
        </div>

        {doctorDecisionNotice && (
          <div className="mb-4 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm font-semibold text-[#1e3a8a]">
            {doctorDecisionNotice}
          </div>
        )}

        {pendingDoctors.length === 0 ? (
          <div className="rounded-2xl bg-surface-soft px-4 py-8 text-center text-sm text-muted">
            Chưa có hồ sơ bác sĩ chờ duyệt.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="bg-surface-soft text-left text-[11px] uppercase tracking-wider text-muted-soft">
                  <th className="px-5 py-3 font-medium">Bác sĩ</th>
                  <th className="px-5 py-3 font-medium">Chuyên khoa</th>
                  <th className="px-5 py-3 font-medium">Giấy phép</th>
                  <th className="px-5 py-3 font-medium">Cấp độ</th>
                  <th className="px-5 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {pendingDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-surface-soft">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-ink">{doctor.fullName}</div>
                      <div className="text-xs text-muted">
                        {doctor.email ?? doctor.phone ?? "Chưa có liên hệ"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#475569]">{doctor.specialty ?? "—"}</td>
                    <td className="px-5 py-4 font-semibold text-ink">{doctor.licenseNumber}</td>
                    <td className="px-5 py-4 text-[#475569]">{doctor.seniorityLevel}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectReason("")
                            setPendingDoctorDecision({ doctor, action: "reject" })
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#fecaca] bg-white px-4 text-xs font-semibold text-danger transition hover:bg-[#fef2f2]"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Từ chối
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectReason("")
                            setPendingDoctorDecision({ doctor, action: "approve" })
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Duyệt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AlertDialog
        open={Boolean(pendingDoctorDecision)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDoctorDecision(null)
            setRejectReason("")
          }
        }}
      >
        <AlertDialogContent className="rounded-3xl border border-hairline-muted bg-white p-0 shadow-[0_18px_60px_rgba(15,23,42,0.16)] sm:max-w-lg">
          <div className="p-5">
            <AlertDialogHeader className="place-items-start gap-2 text-left">
              <AlertDialogTitle className="text-lg font-bold text-ink">
                {pendingDoctorDecision?.action === "approve"
                  ? "Xác nhận duyệt hồ sơ"
                  : "Xác nhận từ chối hồ sơ"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-muted">
                Kiểm tra lại thông tin bác sĩ trước khi xác nhận. Sau thao tác này hệ thống sẽ gửi
                notification cho bác sĩ.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {pendingDoctorDecision && (
              <div className="mt-5 grid gap-3 rounded-2xl bg-surface-soft p-4 text-sm">
                <InfoRow label="Bác sĩ" value={pendingDoctorDecision.doctor.fullName} />
                <InfoRow
                  label="Liên hệ"
                  value={
                    pendingDoctorDecision.doctor.email ??
                    pendingDoctorDecision.doctor.phone ??
                    "Chưa có liên hệ"
                  }
                />
                <InfoRow label="Mã bác sĩ" value={pendingDoctorDecision.doctor.id} />
                <InfoRow label="Giấy phép" value={pendingDoctorDecision.doctor.licenseNumber} />
                <InfoRow
                  label="Chuyên khoa"
                  value={pendingDoctorDecision.doctor.specialty ?? "—"}
                />
                <InfoRow label="Cấp độ" value={pendingDoctorDecision.doctor.seniorityLevel} />
              </div>
            )}

            {pendingDoctorDecision?.action === "reject" && (
              <label className="mt-5 block text-sm text-body">
                <span className="mb-1.5 block font-semibold">
                  Lý do từ chối <span className="text-danger">*</span>
                </span>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={4}
                  placeholder="VD: Mã giấy phép chưa đúng định dạng, vui lòng kiểm tra lại..."
                  className="w-full rounded-2xl border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted-soft focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                {!rejectReason.trim() && (
                  <span className="mt-1.5 block text-xs text-danger">
                    Cần nhập lý do trước khi từ chối hồ sơ.
                  </span>
                )}
              </label>
            )}
          </div>
          <AlertDialogFooter className="m-0 flex-row justify-end gap-2 rounded-b-3xl border-t border-hairline-muted bg-surface-soft p-4">
            <AlertDialogCancel
              disabled={isUpdatingDoctor}
              className="h-10 rounded-full border border-hairline bg-white px-5 text-sm font-semibold text-[#475569] transition hover:bg-hairline-soft"
            >
              Không
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                isUpdatingDoctor ||
                (pendingDoctorDecision?.action === "reject" && !rejectReason.trim())
              }
              onClick={confirmDoctorDecision}
              className={`h-10 rounded-full px-5 text-sm font-semibold text-white transition disabled:opacity-60 ${
                pendingDoctorDecision?.action === "reject"
                  ? "bg-danger hover:bg-[#b91c1c]"
                  : "bg-primary hover:bg-primary-hover"
              }`}
            >
              {isUpdatingDoctor
                ? "Đang xử lý..."
                : pendingDoctorDecision?.action === "reject"
                  ? "Từ chối"
                  : "Xác nhận duyệt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  )
}
