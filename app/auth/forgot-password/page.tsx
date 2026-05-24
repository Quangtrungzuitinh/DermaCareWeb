import { AuthShell } from "@/components/auth/AuthShell"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

export default function Page() {
  return (
    <AuthShell
      title="Khôi phục mật khẩu"
      description="Nhập email tài khoản để nhận liên kết đặt lại mật khẩu."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
