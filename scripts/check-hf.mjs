import { config } from "dotenv"
import sharp from "sharp"

config({ path: ".env.local", quiet: true })
const token = process.env.HF_API_TOKEN || process.env.HF_API_KEY
if (!token) throw new Error("HF_API_TOKEN is missing")
const model = "Jayanth2002/dinov2-base-finetuned-SkinDisease"
const image = await sharp({ create: { width: 224, height: 224, channels: 3, background: { r: 180, g: 140, b: 120 } } }).jpeg().toBuffer()
try {
  const identity = await fetch("https://huggingface.co/api/whoami-v2", {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000),
  })
  console.log(`Token validation HTTP ${identity.status}`)
  if (!identity.ok) process.exitCode = 1
  else {
    for (const format of ["json", "binary"]) {
      const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": format === "json" ? "application/json" : "image/jpeg" },
        body: format === "json" ? JSON.stringify({ inputs: image.toString("base64") }) : image,
        signal: AbortSignal.timeout(45000),
      })
      const raw = await response.text()
      let data
      try { data = JSON.parse(raw) } catch { data = null }
      const valid = Array.isArray(data) && data.length > 0 && data.every((item) => typeof item.label === "string" && Number.isFinite(item.score))
      console.log(JSON.stringify({ format, status: response.status, validPredictions: valid, predictionCount: valid ? data.length : 0, error: typeof data?.error === "string" ? data.error.replaceAll(token, "[redacted]").slice(0, 300) : undefined }))
      if (format === "binary" && (!response.ok || !valid)) process.exitCode = 1
    }
  }
} catch (error) {
  console.error("HF check failed:", error.cause?.code || error.name)
  process.exitCode = 1
}
