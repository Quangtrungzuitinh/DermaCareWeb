import { AuthShell } from "@/components/auth/AuthShell"
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm"

export default function Page() {
  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Tạo mật khẩu mới để tiếp tục sử dụng tài khoản DermaCare."
    >
      <UpdatePasswordForm />
    </AuthShell>
  )
}
