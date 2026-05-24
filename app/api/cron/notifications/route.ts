import { NextRequest } from "next/server"

import { runNotificationAutomation } from "@/services/notification-automation.service"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET?.trim()
  const received = request.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim()

  if (!expected || received !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runNotificationAutomation()
  return Response.json({ ok: true, result })
}
