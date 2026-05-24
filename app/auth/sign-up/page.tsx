import { AuthShell } from "@/components/auth/AuthShell"
import { SignUpForm } from "@/components/auth/SignUpForm"

export default function Page() {
  return (
    <AuthShell
      title="Đăng ký tài khoản bệnh nhân"
      description="Nhập đầy đủ thông tin cá nhân để phòng khám tạo hồ sơ chính xác."
    >
      <SignUpForm />
    </AuthShell>
  )
}
