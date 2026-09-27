import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"
import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/auth/demo-accounts"

export async function GET() {
  const accounts = await prisma.demoTestAccount.findMany({
    where: { isActive: true },
    select: { role: true, email: true, passwordHint: true, displayName: true },
    orderBy: { role: "asc" },
  })
  return NextResponse.json({ accounts })
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_SEED_ENABLED !== "true") {
    return NextResponse.json({ error: "Demo seed is disabled in production" }, { status: 403 })
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: "Thiếu SUPABASE_SERVICE_ROLE_KEY để tạo tài khoản demo" }, { status: 503 })
  }
  const body = await request.json().catch(() => ({})) as { role?: DemoRole }
  const account = DEMO_ACCOUNTS.find((item) => item.role === body.role)
  if (!account) return NextResponse.json({ error: "Role không hợp lệ" }, { status: 400 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) return NextResponse.json({ error: listError.message }, { status: 502 })
  const existing = listed.users.find((user) => user.email?.toLowerCase() === account.email)
  const { data: created, error: createError } = existing
    ? await admin.auth.admin.updateUserById(existing.id, { password: account.password, email_confirm: true })
    : await admin.auth.admin.createUser({ email: account.email, password: account.password, email_confirm: true })
  if (createError || !created.user) return NextResponse.json({ error: createError?.message ?? "Không tạo được user" }, { status: 502 })

  const profile = await prisma.profile.upsert({
    where: { supabaseUserId: created.user.id },
    update: { email: account.email, fullName: `Demo ${account.label}`, role: account.role },
    create: { supabaseUserId: created.user.id, email: account.email, fullName: `Demo ${account.label}`, role: account.role },
  })
  if (account.role === "DOCTOR") {
    await prisma.doctorProfile.upsert({
      where: { profileId: profile.id },
      update: { isActive: true, approvalStatus: "APPROVED", specialty: "Da liễu tổng quát", seniorityLevel: "SENIOR" },
      create: { profileId: profile.id, licenseNumber: "DEMO-AUTH-DOCTOR-001", isActive: true, approvalStatus: "APPROVED", specialty: "Da liễu tổng quát", seniorityLevel: "SENIOR" },
    })
  }
  return NextResponse.json({ role: account.role, email: account.email, password: account.password })
}
