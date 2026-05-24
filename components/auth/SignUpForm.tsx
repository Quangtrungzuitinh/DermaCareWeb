"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const MIN_PASSWORD_LENGTH = 8
const MIN_BIRTH_YEAR = 1900

type SignUpFields = {
  fullName: string
  email: string
  phone: string
  birthYear: string
  province: string
  district: string
  password: string
  repeatPassword: string
}

const initialFields: SignUpFields = {
  fullName: "",
  email: "",
  phone: "",
  birthYear: "",
  province: "",
  district: "",
  password: "",
  repeatPassword: "",
}

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [fields, setFields] = useState<SignUpFields>(initialFields)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const updateField =
    (field: keyof SignUpFields) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFields((current) => ({ ...current, [field]: event.target.value }))
    }

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault()
    const supabase = createClient()
    const currentYear = new Date().getFullYear()
    const parsedBirthYear = Number(fields.birthYear)
    const normalizedEmail = fields.email.trim().toLowerCase()

    setIsLoading(true)
    setError(null)

    if (
      !fields.fullName.trim() ||
      !normalizedEmail ||
      !fields.phone.trim() ||
      !fields.birthYear.trim() ||
      !fields.province.trim() ||
      !fields.district.trim() ||
      !fields.password ||
      !fields.repeatPassword
    ) {
      setError("Vui lòng nhập đầy đủ thông tin đăng ký.")
      setIsLoading(false)
      return
    }

    if (
      !Number.isInteger(parsedBirthYear) ||
      parsedBirthYear < MIN_BIRTH_YEAR ||
      parsedBirthYear > currentYear
    ) {
      setError("Năm sinh không hợp lệ.")
      setIsLoading(false)
      return
    }

    if (fields.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`)
      setIsLoading(false)
      return
    }

    if (fields.password !== fields.repeatPassword) {
      setError("Mật khẩu nhập lại không khớp.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: fields.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/patient/dashboard`,
          data: {
            email: normalizedEmail,
            full_name: fields.fullName.trim(),
            phone: fields.phone.trim(),
            birth_year: parsedBirthYear,
            province: fields.province.trim(),
            district: fields.district.trim(),
          },
        },
      })

      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Không thể tạo tài khoản")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn("rounded-3xl border border-hairline bg-white p-5 shadow-sm sm:p-6", className)}
      {...props}
    >
      <form onSubmit={handleSignUp} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ và tên" htmlFor="fullName">
            <Input
              id="fullName"
              required
              value={fields.fullName}
              onChange={updateField("fullName")}
              placeholder="Nguyễn Minh Anh"
              className="h-11 rounded-xl border-hairline"
            />
          </Field>
          <Field label="Số điện thoại" htmlFor="phone">
            <Input
              id="phone"
              type="tel"
              required
              value={fields.phone}
              onChange={updateField("phone")}
              placeholder="+84 912 345 678"
              className="h-11 rounded-xl border-hairline"
            />
          </Field>
        </div>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={fields.email}
            onChange={updateField("email")}
            placeholder="minhanh.nguyen@example.com"
            className="h-11 rounded-xl border-hairline"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Năm sinh" htmlFor="birthYear">
            <Input
              id="birthYear"
              type="number"
              min={MIN_BIRTH_YEAR}
              max={new Date().getFullYear()}
              required
              value={fields.birthYear}
              onChange={updateField("birthYear")}
              placeholder="1998"
              className="h-11 rounded-xl border-hairline"
            />
          </Field>
          <Field label="Tỉnh/Thành" htmlFor="province">
            <Input
              id="province"
              required
              value={fields.province}
              onChange={updateField("province")}
              placeholder="TP. Hồ Chí Minh"
              className="h-11 rounded-xl border-hairline"
            />
          </Field>
          <Field label="Quận/Huyện" htmlFor="district">
            <Input
              id="district"
              required
              value={fields.district}
              onChange={updateField("district")}
              placeholder="Quận 1"
              className="h-11 rounded-xl border-hairline"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mật khẩu" htmlFor="password">
            <Input
              id="password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={fields.password}
              onChange={updateField("password")}
              className="h-11 rounded-xl border-hairline"
            />
          </Field>
          <Field label="Nhập lại mật khẩu" htmlFor="repeat-password">
            <Input
              id="repeat-password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={fields.repeatPassword}
              onChange={updateField("repeatPassword")}
              className="h-11 rounded-xl border-hairline"
            />
          </Field>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-primary font-bold hover:bg-primary-hover"
          disabled={isLoading}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>

        <p className="text-center text-sm text-muted">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-body">
        {label}
      </Label>
      {children}
    </div>
  )
}
