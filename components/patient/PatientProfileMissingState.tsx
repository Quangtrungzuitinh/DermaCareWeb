export function PatientProfileMissingState() {
  return (
    <div className="min-h-screen bg-surface-soft p-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-hairline bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold text-ink">Không tìm thấy hồ sơ bệnh nhân</h1>
        <p className="mt-2 text-sm text-muted">
          Tài khoản của bạn đã đăng nhập nhưng chưa có hồ sơ trong hệ thống. Vui lòng liên hệ phòng
          khám để được hỗ trợ.
        </p>
      </div>
    </div>
  )
}
