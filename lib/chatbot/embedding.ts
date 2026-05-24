import "server-only"

export type EmbeddingInputType = "query" | "passage"

type EmbedResponse = {
  model: string
  dimension: number
  vectors: number[][]
}

export function toPgVector(vector: number[]) {
  return `[${vector.join(",")}]`
}

export async function embedText(text: string, type: EmbeddingInputType = "query") {
  const baseUrl = process.env.EMBEDDING_SERVICE_URL
  if (!baseUrl) {
    throw new Error("Missing EMBEDDING_SERVICE_URL")
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: [text], type }),
  })

  if (!response.ok) {
    throw new Error(`Embedding service error: ${response.status}`)
  }

  const data = (await response.json()) as EmbedResponse
  const vector = data.vectors[0]

  if (!vector || data.dimension !== 1024) {
    throw new Error(`Unexpected embedding dimension: ${data.dimension}`)
  }

  return vector
}
