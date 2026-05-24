'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { ConsentType } from '@/lib/generated/prisma'
import { revalidatePath } from 'next/cache'

export async function updatePrivacyConsent(agreed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  })
  if (!profile) throw new Error('PROFILE_NOT_FOUND')

  const now = new Date()
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        consentDataStorage: agreed,
        consentGivenAt: agreed ? now : null,
      },
    }),
    prisma.consent.upsert({
      where: {
        patientId_type: { patientId: profile.id, type: ConsentType.STORE_MEDICAL_RECORD },
      },
      update: {
        granted: agreed,
        grantedAt: agreed ? now : null,
        revokedAt: agreed ? null : now,
      },
      create: {
        patientId: profile.id,
        type: ConsentType.STORE_MEDICAL_RECORD,
        granted: agreed,
        grantedAt: agreed ? now : null,
        revokedAt: agreed ? null : now,
      },
    }),
    prisma.consent.upsert({
      where: {
        patientId_type: { patientId: profile.id, type: ConsentType.STORE_SKIN_IMAGE },
      },
      update: {
        granted: agreed,
        grantedAt: agreed ? now : null,
        revokedAt: agreed ? null : now,
      },
      create: {
        patientId: profile.id,
        type: ConsentType.STORE_SKIN_IMAGE,
        granted: agreed,
        grantedAt: agreed ? now : null,
        revokedAt: agreed ? null : now,
      },
    }),
  ])

  revalidatePath('/patient/dashboard')
  return { success: true }
}
