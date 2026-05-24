import { PrismaClient } from "./generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

// Sử dụng DATABASE_URL từ environment
const connectionString = `${process.env.DATABASE_URL}`

// Khai báo kiểu cho global để tránh lỗi TS và rò rỉ Pool khi hot-reload
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
  pgPool?: pg.Pool
}

// 1. Khởi tạo hoặc tái sử dụng Connection Pool của thư viện 'pg' (Node.js native)
const pool = globalForPrisma.pgPool ?? new pg.Pool({ connectionString })

// 2. Tạo Adapter - Cầu nối giúp Prisma chạy bằng JavaScript thuần
const adapter = new PrismaPg(pool)

function hasCurrentGeneratedDelegates(client: PrismaClient | undefined) {
  return Boolean(
    client &&
      "prescription" in client &&
      "prescriptionItem" in client &&
      "encounter" in client &&
      "skinImage" in client &&
      "treatmentPlan" in client &&
      "clinicalObservation" in client &&
      "condition" in client &&
      "followUpNote" in client &&
      "consent" in client &&
      "skinAnalysisResult" in client,
  )
}

// 3. Khởi tạo Prisma Client với Adapter
export const prisma =
  (hasCurrentGeneratedDelegates(globalForPrisma.prisma) ? globalForPrisma.prisma : undefined) ??
  new PrismaClient({
    adapter, // Ép buộc dùng JS Adapter, triệt tiêu lỗi "Engine type client"
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

// Lưu lại vào global trong môi trường dev
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.pgPool = pool
}
