import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { type EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/patient"

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const metadata = user.user_metadata ?? {}
        const birthYear = Number(metadata.birth_year)

        await prisma.profile.upsert({
          where: { supabaseUserId: user.id },
          create: {
            supabaseUserId: user.id,
            email: user.email ?? (typeof metadata.email === "string" ? metadata.email : null),
            phone:
              typeof metadata.phone === "string" && metadata.phone.trim()
                ? metadata.phone.trim()
                : null,
            fullName:
              typeof metadata.full_name === "string" && metadata.full_name.trim()
                ? metadata.full_name.trim()
                : "Người dùng mới",
            birthYear: Number.isInteger(birthYear) ? birthYear : null,
            province:
              typeof metadata.province === "string" && metadata.province.trim()
                ? metadata.province.trim()
                : null,
            district:
              typeof metadata.district === "string" && metadata.district.trim()
                ? metadata.district.trim()
                : null,
            role: "PATIENT",
          },
          update: {
            email: user.email ?? (typeof metadata.email === "string" ? metadata.email : undefined),
            phone:
              typeof metadata.phone === "string" && metadata.phone.trim()
                ? metadata.phone.trim()
                : undefined,
            fullName:
              typeof metadata.full_name === "string" && metadata.full_name.trim()
                ? metadata.full_name.trim()
                : undefined,
            birthYear: Number.isInteger(birthYear) ? birthYear : undefined,
            province:
              typeof metadata.province === "string" && metadata.province.trim()
                ? metadata.province.trim()
                : undefined,
            district:
              typeof metadata.district === "string" && metadata.district.trim()
                ? metadata.district.trim()
                : undefined,
          },
        })
      }

      // redirect user to specified redirect URL or root of app
      redirect(next)
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`)
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`)
}
