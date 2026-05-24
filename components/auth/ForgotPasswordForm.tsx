"use client"

import Link from "next/link"
import { useState } from "react"
import { Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { AuthFormError } from "@/components/auth/AuthFormError"

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Không thể gửi email khôi phục")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn("rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-6", className)}
      {...props}
    >
      {success ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#166534]">
            Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.
          </div>
          <Link
            href="/auth/login"
            className="inline-flex text-sm font-semibold text-[#2563eb] hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-semibold text-[#334155]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="minhanh.nguyen@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-xl border-[#e2e8f0]"
            />
          </div>

          {error && <AuthFormError message={error} />}

          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-[#2563eb] font-bold hover:bg-[#1d4ed8]"
            disabled={isLoading}
          >
            <Mail className="mr-2 h-4 w-4" />
            {isLoading ? "Đang gửi..." : "Gửi email khôi phục"}
          </Button>

          <p className="text-center text-sm text-[#64748b]">
            Đã nhớ mật khẩu?{" "}
            <Link href="/auth/login" className="font-semibold text-[#2563eb] hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
