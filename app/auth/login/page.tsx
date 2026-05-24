import { AuthShell } from "@/components/auth/AuthShell"
import { LoginForm } from "@/components/auth/LoginForm"

export default function Page() {
  return (
    <AuthShell
      title="Đăng nhập"
      description="Truy cập lịch hẹn, hồ sơ sức khỏe và thông tin thanh toán của bạn."
    >
      <LoginForm />
    </AuthShell>
  )
}
