"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth/require-role"
import { prisma } from "@/lib/prisma"

function revalidateFollowUpPaths() {
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/patient/health-records")
}

export async function createFollowUpNote(params: {
  patientId: string
  note: string
  encounterId?: string | null
  treatmentPlanId?: string | null
  nextAction?: string
  scheduledDate?: Date | null
}) {
  const { profile } = await requireRole(["DOCTOR", "STAFF", "ADMIN"])
  if (!params.note.trim()) throw new Error("FOLLOW_UP_NOTE_REQUIRED")

  const followUp = await prisma.followUpNote.create({
    data: {
      patientId: params.patientId,
      encounterId: params.encounterId ?? null,
      treatmentPlanId: params.treatmentPlanId ?? null,
      createdById: profile.id,
      note: params.note.trim(),
      nextAction: params.nextAction?.trim() || null,
      scheduledDate: params.scheduledDate ?? null,
    },
  })
  revalidateFollowUpPaths()
  return followUp
}

export async function markFollowUpDone(followUpId: string, isDone = true) {
  await requireRole(["DOCTOR", "STAFF", "ADMIN"])
  const followUp = await prisma.followUpNote.update({
    where: { id: followUpId },
    data: { isDone },
  })
  revalidateFollowUpPaths()
  return followUp
}
