import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "DermaCare Clinic — Phòng khám da liễu chuyên nghiệp",
  description:
    "Phòng khám da liễu uy tín tại TP.HCM. Đội ngũ bác sĩ hơn 10 năm kinh nghiệm, thiết bị hiện đại, phác đồ điều trị cá nhân hóa.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
