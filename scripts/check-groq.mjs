import { config } from "dotenv"

config({ path: ".env.local", quiet: true })
const key = process.env.GROQ_API_KEY
if (!key) throw new Error("GROQ_API_KEY is missing")
try {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [{ role: "user", content: "Reply with exactly OK." }],
      max_completion_tokens: 128,
      temperature: 0,
    }),
    signal: AbortSignal.timeout(30000),
  })
  const data = await response.json()
  console.log(JSON.stringify({
    status: response.status,
    model: data.model,
    hasReply: Boolean(data.choices?.[0]?.message?.content),
    errorCode: data.error?.code,
    errorType: data.error?.type,
  }))
  if (!response.ok || !data.choices?.[0]?.message?.content) process.exitCode = 1
} catch (error) {
  console.error("Groq connection failed:", error.cause?.code || error.name)
  process.exitCode = 1
}
