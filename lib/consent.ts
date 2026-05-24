import "server-only"

import { ConsentType } from "@/lib/generated/prisma"
import { prisma } from "@/lib/prisma"

export async function requireConsent(patientId: string, type: ConsentType) {
  const consent = await prisma.consent.findUnique({
    where: { patientId_type: { patientId, type } },
  })

  if (consent?.granted) return consent

  if (
    (type === ConsentType.STORE_MEDICAL_RECORD ||
      type === ConsentType.STORE_SKIN_IMAGE ||
      type === ConsentType.USE_IMAGE_FOR_AI_ANALYSIS) &&
    !consent
  ) {
    const profile = await prisma.profile.findUnique({
      where: { id: patientId },
      select: { consentDataStorage: true, consentGivenAt: true },
    })
    if (profile?.consentDataStorage) return profile
  }

  throw new Error(`CONSENT_REQUIRED:${type}`)
}

export async function upsertConsent(params: {
  patientId: string
  type: ConsentType
  granted: boolean
  ipAddress?: string | null
}) {
  const now = new Date()
  return prisma.consent.upsert({
    where: { patientId_type: { patientId: params.patientId, type: params.type } },
    update: {
      granted: params.granted,
      grantedAt: params.granted ? now : null,
      revokedAt: params.granted ? null : now,
      ipAddress: params.ipAddress ?? undefined,
    },
    create: {
      patientId: params.patientId,
      type: params.type,
      granted: params.granted,
      grantedAt: params.granted ? now : null,
      revokedAt: params.granted ? null : now,
      ipAddress: params.ipAddress ?? null,
    },
  })
}
