"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { AuthFormError } from "@/components/auth/AuthFormError"

const MIN_PASSWORD_LENGTH = 8

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`)
      setIsLoading(false)
      return
    }

    if (password !== repeatPassword) {
      setError("Mật khẩu nhập lại không khớp.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push("/patient/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Không thể cập nhật mật khẩu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn("rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-6", className)}
      {...props}
    >
      <form onSubmit={handleUpdatePassword} className="space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-sm font-semibold text-[#334155]">
            Mật khẩu mới
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-xl border-[#e2e8f0]"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="repeat-password" className="text-sm font-semibold text-[#334155]">
            Nhập lại mật khẩu mới
          </Label>
          <Input
            id="repeat-password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            className="h-11 rounded-xl border-[#e2e8f0]"
          />
        </div>

        {error && <AuthFormError message={error} />}

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#2563eb] font-bold hover:bg-[#1d4ed8]"
          disabled={isLoading}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          {isLoading ? "Đang lưu..." : "Lưu mật khẩu mới"}
        </Button>
      </form>
    </div>
  )
}
