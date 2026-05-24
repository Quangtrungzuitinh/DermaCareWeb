"use server"

import { revalidatePath } from "next/cache"
import { logClinicalAction } from "@/lib/audit"
import { requireRole } from "@/lib/auth/require-role"
import { prisma } from "@/lib/prisma"
import { MedicalRecordStatus } from "@/lib/generated/prisma"

function revalidateTreatmentPlanPaths() {
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/doctor/medical-records")
  revalidatePath("/patient")
  revalidatePath("/patient/health-records")
}

async function getEditableRecord(medicalRecordId: string, doctorId: string | undefined) {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: medicalRecordId },
    select: {
      id: true,
      patientId: true,
      doctorId: true,
      diagnosis: true,
      planDescription: true,
      status: true,
    },
  })
  if (!record) throw new Error("MEDICAL_RECORD_NOT_FOUND")
  if (!record.patientId) throw new Error("PATIENT_REQUIRED")
  if (!record.doctorId) throw new Error("DOCTOR_REQUIRED")
  if (record.status === MedicalRecordStatus.FINALIZED) {
    throw new Error("MEDICAL_RECORD_FINALIZED")
  }
  if (doctorId && doctorId !== record.doctorId) {
    throw new Error("FORBIDDEN: Không phải hồ sơ của bác sĩ này")
  }
  return record
}

export async function createTreatmentPlan(params: {
  medicalRecordId: string
  goal?: string
  expectedEndDate?: Date | null
  steps?: Array<{ weekNumber: number; instruction: string; medication?: string; followUpRequired?: boolean }>
}) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  const record = await getEditableRecord(
    params.medicalRecordId,
    profile.role === "DOCTOR" ? profile.doctorProfile?.id : undefined,
  )

  const plan = await prisma.$transaction(async (tx) => {
    const created = await tx.treatmentPlan.create({
      data: {
        patientId: record.patientId!,
        doctorId: record.doctorId!,
        medicalRecordId: record.id,
        diagnosis: record.diagnosis,
        goal: params.goal?.trim() || record.planDescription || null,
        startDate: new Date(),
        expectedEndDate: params.expectedEndDate ?? null,
        steps: {
          create: (params.steps ?? []).map((step) => ({
            weekNumber: step.weekNumber,
            instruction: step.instruction.trim(),
            medication: step.medication?.trim() || null,
            followUpRequired: step.followUpRequired ?? false,
          })),
        },
      },
      include: { steps: true },
    })

    await logClinicalAction(tx, {
      actorId: profile.id,
      actorRole: profile.role,
      action: "TREATMENT_PLAN_CREATED",
      targetTable: "treatment_plans",
      targetId: created.id,
      newValue: { medicalRecordId: record.id, stepCount: created.steps.length },
    })

    return created
  })

  revalidateTreatmentPlanPaths()
  return plan
}

export async function addTreatmentPlanStep(params: {
  planId: string
  weekNumber: number
  instruction: string
  medication?: string
  followUpRequired?: boolean
}) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  const plan = await prisma.treatmentPlan.findUnique({ where: { id: params.planId } })
  if (!plan) throw new Error("TREATMENT_PLAN_NOT_FOUND")
  if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== plan.doctorId) {
    throw new Error("FORBIDDEN")
  }

  const step = await prisma.treatmentPlanStep.create({
    data: {
      planId: plan.id,
      weekNumber: params.weekNumber,
      instruction: params.instruction.trim(),
      medication: params.medication?.trim() || null,
      followUpRequired: params.followUpRequired ?? false,
    },
  })
  revalidateTreatmentPlanPaths()
  return step
}

export async function markTreatmentPlanStepDone(stepId: string, isDone = true) {
  await requireRole(["DOCTOR", "ADMIN"])
  const step = await prisma.treatmentPlanStep.update({
    where: { id: stepId },
    data: { isDone, completedAt: isDone ? new Date() : null },
  })
  revalidateTreatmentPlanPaths()
  return step
}
