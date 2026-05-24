"use server"

import { revalidatePath } from "next/cache"
import { ConditionStatus } from "@/lib/generated/prisma"
import { requireRole } from "@/lib/auth/require-role"
import { prisma } from "@/lib/prisma"

function revalidateConditionPaths() {
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/patient/health-records")
}

export async function createCondition(params: {
  patientId: string
  name: string
  encounterId?: string | null
  medicalRecordId?: string | null
  icdCode?: string
  severity?: string
  notes?: string
}) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  if (!params.name.trim()) throw new Error("CONDITION_NAME_REQUIRED")

  if (profile.role === "DOCTOR") {
    const owned = await prisma.appointment.findFirst({
      where: { patientId: params.patientId, doctorId: profile.doctorProfile?.id },
      select: { id: true },
    })
    if (!owned) throw new Error("FORBIDDEN")
  }

  const condition = await prisma.condition.create({
    data: {
      patientId: params.patientId,
      encounterId: params.encounterId ?? null,
      medicalRecordId: params.medicalRecordId ?? null,
      name: params.name.trim(),
      icdCode: params.icdCode?.trim() || null,
      severity: params.severity?.trim() || null,
      notes: params.notes?.trim() || null,
    },
  })
  revalidateConditionPaths()
  return condition
}

export async function updateConditionStatus(
  conditionId: string,
  status: ConditionStatus,
  notes?: string,
) {
  await requireRole(["DOCTOR", "ADMIN"])
  const condition = await prisma.condition.update({
    where: { id: conditionId },
    data: {
      status,
      resolvedDate: status === ConditionStatus.RESOLVED ? new Date() : null,
      notes: notes?.trim() ? notes.trim() : undefined,
    },
  })
  revalidateConditionPaths()
  return condition
}
