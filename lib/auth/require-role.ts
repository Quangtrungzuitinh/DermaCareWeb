import "server-only"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import type { Role } from "@/lib/generated/prisma"
import { getPostLoginPath } from "@/lib/auth/role-redirect"

export async function requireRole(allowedRoles: Role[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  let profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    include: { doctorProfile: true },
  })

  if (!profile) redirect("/auth/login")

  if (!profile.email && user.email) {
    profile = await prisma.profile.update({
      where: { id: profile.id },
      data: { email: user.email },
      include: { doctorProfile: true },
    })
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect(getPostLoginPath(profile.role))
  }

  return { user, profile }
}
