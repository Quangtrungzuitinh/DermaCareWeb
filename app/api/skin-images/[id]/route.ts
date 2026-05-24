import { NextResponse } from "next/server"
import { Readable } from "stream"
import { getDriveFileStream } from "@/lib/google-drive"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where: { supabaseUserId: user.id },
    include: { doctorProfile: true },
  })
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const skinImage = await prisma.skinImage.findFirst({
    where: { id, deletedAt: null },
    include: {
      medicalRecord: { select: { doctorId: true } },
    },
  })
  if (!skinImage) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const canView =
    profile.role === "ADMIN" ||
    profile.role === "STAFF" ||
    (profile.role === "PATIENT" && skinImage.patientId === profile.id) ||
    (profile.role === "DOCTOR" && skinImage.medicalRecord?.doctorId === profile.doctorProfile?.id)

  if (!canView) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const stream = await getDriveFileStream(skinImage.driveFileId)
  const webStream = Readable.toWeb(stream) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": skinImage.mimeType,
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="${skinImage.fileName.replace(/"/g, "")}"`,
    },
  })
}
