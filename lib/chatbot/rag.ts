import "server-only"

import { prisma } from "@/lib/prisma"
import { embedText, toPgVector } from "@/lib/chatbot/embedding"
import { logger } from "@/lib/logger"

const MIN_SIMILARITY = 0.65

export type RagContext = {
  id: string
  title: string
  content: string
  category: string
  similarity: number
}

type RagRow = {
  id: string
  title: string
  content: string
  category: string
  similarity: number | string
}

export async function retrieveContext(query: string, topK = 5): Promise<RagContext[]> {
  let vector: string

  try {
    const embedding = await embedText(query, "query")
    vector = toPgVector(embedding)
  } catch (error) {
    logger.warn("[chatbot] embedding retrieval skipped", error)
    return []
  }

  const rows = await prisma.$queryRaw<RagRow[]>`
    SELECT
      "id",
      "title",
      "content",
      "category",
      1 - ("embedding" <=> ${vector}::vector) AS "similarity"
    FROM "knowledge_base"
    WHERE "isActive" = true
      AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${vector}::vector
    LIMIT ${topK}
  `

  return rows
    .map((row) => ({
      ...row,
      similarity: Number(row.similarity),
    }))
    .filter((row) => row.similarity >= MIN_SIMILARITY)
}

export function formatRagContext(contexts: RagContext[]) {
  if (!contexts.length) {
    return "Không tìm thấy tài liệu knowledge base liên quan."
  }

  return contexts
    .map(
      (context) =>
        `[${context.category}] ${context.title} (similarity: ${context.similarity.toFixed(2)})\n${context.content}`,
    )
    .join("\n\n---\n\n")
}
