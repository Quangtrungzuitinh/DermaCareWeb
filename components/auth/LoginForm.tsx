"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPostLoginPath } from "@/lib/auth/role-redirect"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { AuthFormError } from "@/components/auth/AuthFormError"

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("supabase_user_id", data.user.id)
        .single()

      router.push(getPostLoginPath(profile?.role))
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Không thể đăng nhập")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn("rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-6", className)}
      {...props}
    >
      <form onSubmit={handleLogin} className="space-y-5">
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

        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <Label htmlFor="password" className="text-sm font-semibold text-[#334155]">
              Mật khẩu
            </Label>
            <Link
              href="/auth/forgot-password"
              className="ml-auto text-xs font-semibold text-[#2563eb] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-xl border-[#e2e8f0]"
          />
        </div>

        {error && <AuthFormError message={error} />}

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#2563eb] font-bold hover:bg-[#1d4ed8]"
          disabled={isLoading}
        >
          <LogIn className="mr-2 h-4 w-4" />
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

        <p className="text-center text-sm text-[#64748b]">
          Chưa có tài khoản?{" "}
          <Link href="/auth/sign-up" className="font-semibold text-[#2563eb] hover:underline">
            Đăng ký
          </Link>
        </p>
      </form>
    </div>
  )
}
