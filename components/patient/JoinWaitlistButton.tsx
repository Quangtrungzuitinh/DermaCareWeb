"use client"

import { useState, useTransition } from "react"
import { Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { joinWaitlist } from "@/lib/actions/waitlist.actions"
import { formatVND } from "@/lib/format"

type Service = { id: string; name: string; price: number }

export function JoinWaitlistButton({
  doctorId,
  services,
}: {
  doctorId: string
  services: Service[]
}) {
  const [open, setOpen] = useState(false)
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setServiceId(services[0]?.id ?? "")
    setNotes("")
    setError("")
    setSuccess(false)
    setOpen(true)
  }

  function handleSubmit() {
    if (!serviceId) return
    setError("")
    startTransition(async () => {
      try {
        await joinWaitlist({ serviceId, preferredDoctorId: doctorId, notes: notes || undefined })
        setSuccess(true)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không thể đăng ký hàng chờ."
        setError(
          msg === "ALREADY_WAITLISTED"
            ? "Bạn đã có trong danh sách chờ cho dịch vụ này."
            : msg,
        )
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
      >
        <Clock className="h-3.5 w-3.5" />
        Hàng chờ
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border-hairline-muted p-0 sm:max-w-md">
          <div className="border-b border-hairline-muted px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-ink">Đăng ký hàng chờ</DialogTitle>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-5">
            {success ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-green-700">
                  Đăng ký thành công! Chúng tôi sẽ thông báo khi có lịch trống.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 h-9 rounded-full bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted">Dịch vụ</label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="h-10 w-full rounded-full border border-hairline bg-white px-3 text-sm text-ink outline-none focus:border-primary"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {formatVND(service.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted">
                    Ghi chú <span className="normal-case text-muted-soft">(tùy chọn)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="VD: Muốn tái khám sau 1 tháng điều trị..."
                    className="w-full rounded-2xl border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-primary"
                  />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-10 rounded-full border border-hairline px-5 text-sm font-semibold text-slate-600 transition hover:bg-surface-soft"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || !serviceId}
                    className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Đang xử lý..." : "Đăng ký hàng chờ"}
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
