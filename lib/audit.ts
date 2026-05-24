import type { Prisma, Role } from "@/lib/generated/prisma"

export type ClinicalAuditAction =
  | "ENCOUNTER_CREATED"
  | "MEDICAL_RECORD_DRAFT_SAVED"
  | "MEDICAL_RECORD_FINALIZED"
  | "MEDICAL_RECORD_AMENDED"
  | "ENCOUNTER_COMPLETED"
  | "PRESCRIPTION_CREATED"
  | "SKIN_IMAGE_UPLOADED"
  | "SKIN_IMAGE_DELETED"
  | "TREATMENT_PLAN_CREATED"
  | "SKIN_ANALYSIS_TRIGGERED"
  | "SKIN_ANALYSIS_CONFIRMED"
  | "PATIENT_RECORD_VIEWED"
  | "PATIENT_PRESCRIPTION_DOWNLOADED"

export async function logClinicalAction(
  tx: Prisma.TransactionClient,
  params: {
    actorId: string
    actorRole: Role
    action: ClinicalAuditAction
    targetTable: string
    targetId: string
    oldValue?: Prisma.InputJsonValue
    newValue?: Prisma.InputJsonValue
  },
) {
  await tx.audit_logs.create({
    data: {
      id: crypto.randomUUID(),
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      targetTable: params.targetTable,
      targetId: params.targetId,
      oldValue: params.oldValue,
      newValue: params.newValue,
    },
  })
}
