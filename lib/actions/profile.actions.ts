"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/require-role"

export async function updateProfile(params: {
  fullName: string
  phone?: string
  birthYear?: number
  province?: string
  district?: string
}) {
  const { profile } = await requireRole(["PATIENT"])
  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      fullName: params.fullName,
      phone: params.phone || null,
      birthYear: params.birthYear ?? null,
      province: params.province || null,
      district: params.district || null,
    },
  })
  revalidatePath("/patient")
  return updated
}
