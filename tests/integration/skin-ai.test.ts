import { expect, test, vi } from "vitest"
import sharp from "sharp"
import { SKIN_MODEL_LABELS } from "../../constants/skin-model-labels"

// The framework guard is unnecessary in this Node-only test. The model call is real.
vi.mock("server-only", () => ({}))

import { querySkinDiseaseModel } from "../../lib/hf-skin-model"

test("HF-SKIN-001: a synthetic JPEG returns valid predictions from the live model", async () => {
  if (!(process.env.HF_API_TOKEN || process.env.HF_API_KEY)) {
    throw new Error("Set HF_API_TOKEN in .env.local before running npm run test:skin-ai")
  }

  const jpeg = await sharp({
    create: {
      width: 224,
      height: 224,
      channels: 3,
      background: { r: 180, g: 140, b: 120 },
    },
  }).jpeg().toBuffer()

  const predictions = await querySkinDiseaseModel(jpeg.toString("base64"))

  expect(predictions.length).toBeGreaterThan(0)
  for (const prediction of predictions) {
    expect(typeof prediction.label).toBe("string")
    expect(prediction.label.trim().length).toBeGreaterThan(0)
    expect(SKIN_MODEL_LABELS).toContain(prediction.label)
    expect(Number.isFinite(prediction.score)).toBe(true)
    expect(prediction.score).toBeGreaterThanOrEqual(0)
    expect(prediction.score).toBeLessThanOrEqual(1)
  }
})
