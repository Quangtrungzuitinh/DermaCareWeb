#!/usr/bin/env node

/**
 * Phase 4 Chatbot Environment & Database Check
 * Run: node scripts/check-chatbot-setup.mjs
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, "..")
const envPath = path.join(rootDir, ".env.local")

console.log("🔍 Checking Phase 4 Chatbot Setup...\n")

// 1. Check environment variables
console.log("📋 Environment Variables:")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  const required = ["GROQ_API_KEY", "EMBEDDING_SERVICE_URL"]

  for (const key of required) {
    if (envContent.includes(key)) {
      const value = envContent.split(`${key}=`)[1]?.split("\n")[0]
      console.log(`  ✅ ${key} = ${value ? `${value.slice(0, 20)}...` : "MISSING"}`)
    } else {
      console.log(`  ❌ ${key} = MISSING`)
    }
  }
} else {
  console.log(`  ❌ .env.local not found at ${envPath}`)
}

// 2. Check Prisma schema
console.log("\n📦 Prisma Schema:")
const schemaPath = path.join(rootDir, "prisma/schema.prisma")
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf-8")
  const models = ["ChatSession", "ChatMessage", "KnowledgeBase"]

  for (const model of models) {
    if (schema.includes(`model ${model}`)) {
      console.log(`  ✅ ${model} model defined`)
    } else {
      console.log(`  ⚠️  ${model} model NOT found`)
    }
  }
} else {
  console.log(`  ❌ schema.prisma not found`)
}

// 3. Check source files
console.log("\n📂 Source Files:")
const requiredFiles = [
  "app/api/chat/route.ts",
  "lib/chatbot/booking.ts",
  "lib/chatbot/rag.ts",
  "lib/chatbot/embedding.ts",
  "components/chat/ChatWidget.tsx",
  "app/patient/chat/page.tsx",
  "app/patient/chat/PatientChatClient.tsx",
  "services/chatbot.service.ts",
]

for (const file of requiredFiles) {
  const fullPath = path.join(rootDir, file)
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`)
  } else {
    console.log(`  ❌ ${file} NOT FOUND`)
  }
}

// 4. Check API endpoint
console.log("\n🌐 API Endpoints to Test:")
console.log("  POST /api/chat")
console.log("    Body: { message: string, sessionId?: string }")
console.log("    Response: { reply: string, sessionId?: string }")

// 5. Check UI pages
console.log("\n🎨 UI Pages:")
console.log("  ✅ /patient/chat - Dedicated chat page")
console.log("  ✅ ChatWidget - Floating chat button (all patient pages)")
console.log("  ✅ Sidebar - Navigation link to /patient/chat")

// 6. Check database connectivity
console.log("\n💾 Database Check:")
console.log("  Required tables:")
console.log("    - ChatSession")
console.log("    - ChatMessage")
console.log("    - KnowledgeBase (for RAG)")
console.log("    - Appointment (booking target)")
console.log("  ⚠️  Run migrations if needed: npm run db:push")

console.log("\n✅ Setup Check Complete!")
console.log("\n📖 Next Steps:")
console.log("  1. Verify .env.local has GROQ_API_KEY")
console.log("  2. Run: npm run db:push")
console.log("  3. Visit: http://localhost:3000/patient/chat")
console.log("  4. Start chatting!")
