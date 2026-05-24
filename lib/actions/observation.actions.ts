"use server"

import { revalidatePath } from "next/cache"
import {
  DERMATOLOGY_OBSERVATIONS,
  type DermatologyObservationType,
  validateObservationValue,
} from "@/constants/observations"
import { requireRole } from "@/lib/auth/require-role"
import { prisma } from "@/lib/prisma"

function revalidateObservationPaths() {
  revalidatePath("/doctor")
  revalidatePath("/doctor/appointments")
  revalidatePath("/patient/health-records")
}

export async function addObservation(params: {
  encounterId: string
  type: DermatologyObservationType
  value: string
  note?: string
}) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  const encounter = await prisma.encounter.findUnique({
    where: { id: params.encounterId },
    select: { id: true, doctorId: true },
  })
  if (!encounter) throw new Error("ENCOUNTER_NOT_FOUND")
  if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== encounter.doctorId) {
    throw new Error("FORBIDDEN")
  }

  const config = DERMATOLOGY_OBSERVATIONS[params.type]
  const observation = await prisma.clinicalObservation.create({
    data: {
      encounterId: encounter.id,
      type: params.type,
      value: validateObservationValue(params.type, params.value),
      unit: config.unit,
      note: params.note?.trim() || null,
    },
  })
  revalidateObservationPaths()
  return observation
}

export async function updateObservation(
  observationId: string,
  data: { value?: string; note?: string },
) {
  const { profile } = await requireRole(["DOCTOR", "ADMIN"])
  const observation = await prisma.clinicalObservation.findUnique({
    where: { id: observationId },
    include: { encounter: { select: { doctorId: true } } },
  })
  if (!observation) throw new Error("OBSERVATION_NOT_FOUND")
  if (profile.role === "DOCTOR" && profile.doctorProfile?.id !== observation.encounter.doctorId) {
    throw new Error("FORBIDDEN")
  }

  const updated = await prisma.clinicalObservation.update({
    where: { id: observation.id },
    data: {
      value:
        data.value !== undefined
          ? validateObservationValue(observation.type as DermatologyObservationType, data.value)
          : undefined,
      note: data.note?.trim() ? data.note.trim() : data.note === "" ? null : undefined,
    },
  })
  revalidateObservationPaths()
  return updated
}
