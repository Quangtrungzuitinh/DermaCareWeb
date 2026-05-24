import { NextRequest } from "next/server"
import { confirmPayment } from "@/lib/actions/payment.actions"
import { ConfirmationSource } from "@/lib/generated/prisma"
import { logger } from "@/lib/logger"
import { notifyWebhookFailure } from "@/services/notification.service"

export const runtime = "nodejs"

interface SepayTransaction {
  id?: number
  gateway?: string
  transactionDate?: string
  accountNumber?: string
  subAccount?: string | null
  code?: string | null
  content?: string
  transferType?: string
  transferAmount?: number | string
  accumulated?: number
  referenceCode?: string
  description?: string
  transfer_type?: string
  transfer_amount?: number | string
}

const CK_PARTIAL_RE = /CK\s+([a-z0-9]{22})/i

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization") ?? ""

  if (!isValidSepayApiKey(authHeader, process.env.WEBHOOK_SECRET)) {
    logger.warn("[Webhook/SePay] Invalid Authorization header")
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const payload = normalizeSepayPayload(rawBody)
  if (!payload) {
    logger.info("[Webhook/SePay] Skipped empty or unparseable payload")
    return new Response(null, { status: 201 })
  }

  const transferType = payload.transferType ?? payload.transfer_type
  if (transferType !== "in") {
    return new Response(null, { status: 201 })
  }

  const memo = buildMemoForCkMatch(payload)
  const match = memo.match(CK_PARTIAL_RE)
  if (!match) {
    logger.info("[Webhook/SePay] Skipped no CK pattern in memo fields")
    return new Response(null, { status: 201 })
  }

  const partialId = match[1]!.toLowerCase()
  const amount = parseTransferAmountVnd(payload.transferAmount ?? payload.transfer_amount)
  if (amount === null) {
    logger.info("[Webhook/SePay] Skipped invalid transfer amount")
    return new Response(null, { status: 201 })
  }

  try {
    const result = await confirmPayment({
      partialAppointmentId: partialId,
      amount,
      confirmedById: null,
      source: ConfirmationSource.WEBHOOK,
    })

    const status = result.idempotent ? "idempotent" : "confirmed"
    logger.info("[Webhook/SePay] Payment confirmation processed", { status, partialId, amount })
    return new Response(null, { status: 201 })
  } catch (error: unknown) {
    if (isPrismaUniqueError(error)) {
      logger.info("[Webhook/SePay] P2002 idempotent", { partialId })
      return new Response(null, { status: 201 })
    }

    if (error instanceof Error && isNonRetryableConfirmError(error.message)) {
      logger.warn("[Webhook/SePay] confirmPayment rejected", {
        message: error.message,
        partialId,
        amount,
      })
      return new Response(null, { status: 201 })
    }

    logger.error("[Webhook/SePay] Error", error, { partialId, amount })
    await notifyWebhookFailure(partialId)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}

function normalizeSepayPayload(raw: unknown): SepayTransaction | null {
  if (raw === null || raw === undefined) return null

  if (Array.isArray(raw)) {
    return asSepayTransaction(raw[0])
  }

  if (typeof raw !== "object") return null

  const object = raw as Record<string, unknown>
  if ("data" in object) {
    return Array.isArray(object.data)
      ? asSepayTransaction(object.data[0])
      : asSepayTransaction(object.data)
  }

  return asSepayTransaction(raw)
}

function asSepayTransaction(value: unknown): SepayTransaction | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as SepayTransaction)
    : null
}

function isValidSepayApiKey(authHeader: string, secret: string | undefined): boolean {
  const expected = (secret ?? "").trim()
  if (!expected) return false

  const match = /^apikey\s+(.+)$/i.exec(authHeader.trim())
  return Boolean(match && match[1]!.trim() === expected)
}

function buildMemoForCkMatch(payload: SepayTransaction): string {
  return [payload.content, payload.description, payload.code]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .join(" ")
}

function parseTransferAmountVnd(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null
  }

  if (typeof raw === "string") {
    const value = raw.trim()
    if (!/^\d+$/.test(value)) return null
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

function isNonRetryableConfirmError(message: string): boolean {
  return (
    message === "APPOINTMENT_NOT_FOUND" ||
    message.startsWith("INVALID_STATUS:") ||
    message.startsWith("INSUFFICIENT_AMOUNT:")
  )
}

function isPrismaUniqueError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  )
}
