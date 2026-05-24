/**
 * Phase 4 Chatbot - Example Testing Script
 *
 * Usage:
 *   node scripts/test-chatbot.mjs
 *
 * This script demonstrates:
 *   - Simple FAQ query
 *   - Booking flow with slot selection
 *   - Error handling
 */

import fetch from "node-fetch"

const API_URL = process.env.API_URL || "http://localhost:3000"
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function chatMessage(message, sessionId) {
  console.log(`\n👤 User: ${message}`)
  console.log("⏳ Bot is typing...")

  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId: sessionId || null }),
  })

  const data = await response.json()

  console.log(`\n🤖 Bot: ${data.reply}`)

  if (data.error) {
    console.log(`❌ Error: ${data.error}`)
  }

  return { sessionId: data.sessionId || sessionId, reply: data.reply }
}

async function runTest() {
  console.log("🧪 Phase 4 Chatbot - Test Script")
  console.log("================================\n")

  let sessionId = null

  try {
    // Test 1: FAQ
    console.log("TEST 1️⃣ : Simple FAQ")
    console.log("-".repeat(50))
    let result = await chatMessage("Phòng khám có dịch vụ gì?", null)
    sessionId = result.sessionId
    await delay(1000)

    // Test 2: Booking start
    console.log("\n\nTEST 2️⃣ : Booking Intent")
    console.log("-".repeat(50))
    result = await chatMessage("Tôi muốn đặt lịch khám mụn", sessionId)
    sessionId = result.sessionId
    await delay(1000)

    // Test 3: Slot selection
    console.log("\n\nTEST 3️⃣ : Select Slot")
    console.log("-".repeat(50))
    result = await chatMessage("Chọn slot 1", sessionId)
    sessionId = result.sessionId
    await delay(1000)

    // Test 4: Confirmation
    console.log("\n\nTEST 4️⃣ : Confirm Booking")
    console.log("-".repeat(50))
    result = await chatMessage("Xác nhận", sessionId)
    sessionId = result.sessionId

    console.log("\n\n✅ Tests Complete!")
    console.log(`📋 Session ID: ${sessionId}`)
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run tests
runTest()
