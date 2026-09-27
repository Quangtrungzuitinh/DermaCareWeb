import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { triageSkinAnalysis } from "@/lib/skin-triage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RequestBody = {
  ai_predictions?: unknown
  user_meta?: { age?: unknown }
}

export async function POST(request: Request) {
  let body: RequestBody
  try {
    body = await request.json() as RequestBody
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 })
  }

  if (!body.ai_predictions || typeof body.ai_predictions !== "object" || Array.isArray(body.ai_predictions)) {
    return NextResponse.json({ error: "ai_predictions must be an object" }, { status: 400 })
  }

  const predictions = Object.fromEntries(
    Object.entries(body.ai_predictions).map(([code, probability]) => [code, Number(probability)]),
  )
  const age = body.user_meta?.age == null ? null : Number(body.user_meta.age)
  if (age !== null && (!Number.isInteger(age) || age < 0 || age > 130)) {
    return NextResponse.json({ error: "user_meta.age must be between 0 and 130" }, { status: 400 })
  }

  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: { isActive: true, approvalStatus: "APPROVED", profile: { role: "DOCTOR" } },
      select: {
        specialty: true,
        expertiseTags: true,
        profile: { select: { fullName: true } },
      },
    })
    const result = triageSkinAnalysis({
      ai_predictions: predictions,
      user_meta: { age },
      doctors_db: doctors.map((doctor) => ({
        name: doctor.profile?.fullName ?? "Bác sĩ chưa cập nhật tên",
        specialties: doctor.specialty ? [doctor.specialty] : [],
        tags: doctor.expertiseTags,
        is_telehealth_active: true,
      })),
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && ["NO_VALID_SKIN_PREDICTION", "UNKNOWN_SKIN_PREDICTION"].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    console.error("[skin-triage] request failed")
    return NextResponse.json({ error: "SKIN_TRIAGE_FAILED" }, { status: 500 })
  }
}
