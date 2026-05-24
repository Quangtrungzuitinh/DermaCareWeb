"use client"

import Image from "next/image"
import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { formatVND } from "@/lib/format"

interface PaymentQRProps {
  qrUrl: string
  amount: number
  addInfo: string
  bankName: string
  accountNo: string
  accountName: string
}

export function PaymentQR({
  qrUrl,
  amount,
  addInfo,
  bankName,
  accountNo,
  accountName,
}: PaymentQRProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(addInfo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedAmount = formatVND(amount)

  return (
    <div className="w-full min-w-0">
      <div className="flex justify-center">
        <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
          <Image
            src={qrUrl}
            alt="Mã QR thanh toán"
            width={280}
            height={280}
            priority
            unoptimized
            className="h-auto w-[280px] max-w-full"
          />
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-5">
        <InfoRow label="Ngân hàng" value={bankName} />
        <InfoRow label="Số tài khoản" value={accountNo} />
        <InfoRow label="Tên tài khoản" value={accountName} />

        <div>
          <p className="mb-1 text-xs font-semibold text-[#94a3b8]">Số tiền</p>
          <p className="text-2xl font-black text-[#dc2626]">{formattedAmount}</p>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-[#94a3b8]">Nội dung chuyển khoản</p>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate font-mono text-base font-semibold text-[#0f172a]">
              {addInfo}
            </p>
            <button
              onClick={handleCopy}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:text-[#2563eb]"
              aria-label="Sao chép nội dung"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-[#94a3b8]">{label}</p>
      <p className="truncate text-base font-bold text-[#0f172a]">{value}</p>
    </div>
  )
}
