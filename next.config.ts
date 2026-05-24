import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  // GIỮ LẠI: Chốt chặn quan trọng nhất cho Prisma 7
  serverExternalPackages: [path.resolve(__dirname, "./lib/generated/prisma")],

  // BỔ SUNG: Mở khóa bảo mật HMR cho domain Ngrok
  // Chú ý: Cập nhật lại domain này nếu bạn khởi động lại Ngrok và bị đổi link
  allowedDevOrigins: ["https://cobalt-mulch-update.ngrok-free.dev"],
}

export default nextConfig
