import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatAppointmentDate, formatVND } from "@/lib/format"

interface PageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const { id } = await searchParams

  const appointment = id
    ? await prisma.appointment.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          appointmentDate: true,
          baseFee: true,
          guestName: true,
          guestPhone: true,
          patientId: true,
          patient: { select: { fullName: true, phone: true } },
          doctor: { include: { profile: true } },
          payment: { select: { amount: true, confirmedAt: true } },
        },
      })
    : null

  const canOpenPatientAppointments = Boolean(appointment?.patientId)

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-4 py-12">
      <div className="w-full max-w-[560px] rounded-2xl bg-canvas p-8 text-center shadow-elevated">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-success">
          ✓
        </div>

        <h2 className="mb-3 text-2xl font-bold text-ink">Đặt lịch thành công!</h2>

        <p className="mx-auto mb-7 max-w-[440px] text-sm leading-relaxed text-muted">
          Ca khám của bạn đã được xác nhận. Phòng khám sẽ liên hệ qua số điện thoại để nhắc lịch
          trước 1 ngày.
        </p>

        {appointment ? (
          <div className="mb-7 rounded-2xl border border-hairline bg-surface-soft p-5 text-left">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Thông tin lịch hẹn
                </div>
                <div className="mt-1 text-lg font-black text-ink">
                  {appointment.patient?.fullName ?? appointment.guestName ?? "Khách vãng lai"}
                </div>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                Đã xác nhận
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <InfoRow label="Mã lịch hẹn" value={appointment.id.slice(-8).toUpperCase()} />
              <InfoRow
                label="Bác sĩ"
                value={`BS. ${appointment.doctor.profile?.fullName ?? "Bác sĩ đã ngừng hoạt động"}`}
              />
              <InfoRow
                label="Thời gian"
                value={formatAppointmentDate(appointment.appointmentDate, "HH:mm dd/MM/yyyy")}
              />
              <InfoRow
                label="Số điện thoại"
                value={appointment.patient?.phone ?? appointment.guestPhone ?? "Chưa có"}
              />
              <InfoRow
                label="Đã đặt cọc"
                value={formatVND(appointment.payment?.amount ?? appointment.baseFee)}
                strong
              />
            </div>
          </div>
        ) : (
          <div className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Không tìm thấy mã lịch hẹn trong đường dẫn. Nếu bạn đã thanh toán, vui lòng liên hệ
            phòng khám để được hỗ trợ.
          </div>
        )}

        <div className="space-y-3">
          {canOpenPatientAppointments ? (
            <Link href="/patient/appointments" className="block w-full">
              <button className="h-11 w-full rounded-lg bg-navy text-sm font-semibold text-white transition-colors hover:bg-navy-dark">
                Xem lịch hẹn của tôi
              </button>
            </Link>
          ) : null}

          <Link href="/" className="block w-full">
            <button className="h-11 w-full rounded-lg border border-hairline bg-canvas text-sm font-semibold text-body transition-colors hover:bg-surface-soft">
              Về trang chủ
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-hairline pt-3 first:border-t-0 first:pt-0">
      <span className="text-muted">{label}</span>
      <span className={`text-right font-semibold ${strong ? "text-danger" : "text-ink"}`}>
        {value}
      </span>
    </div>
  )
}
