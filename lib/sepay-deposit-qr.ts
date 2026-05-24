export interface SepayDepositDetails {
  qrUrl: string
  amount: number
  addInfo: string
  bankName: string
  accountNo: string
  accountName: string
}

export function buildSepayTransferContent(appointmentId: string): string {
  return `CK ${appointmentId.slice(-22)}`
}

export function generateSepayDepositQRImageUrl(appointmentId: string, amount: number): string {
  const acc = process.env.SEPAY_ACCOUNT_NO ?? ""
  const bank = process.env.SEPAY_BANK_CODE?.trim() || process.env.SEPAY_BANK_ID?.trim() || ""
  const des = buildSepayTransferContent(appointmentId)

  const url = new URL("https://qr.sepay.vn/img")
  url.searchParams.set("acc", acc)
  url.searchParams.set("bank", bank)
  url.searchParams.set("amount", String(amount))
  url.searchParams.set("des", des)
  return url.toString()
}

export function sepayBankDisplayLabel(): string {
  return (
    process.env.SEPAY_BANK_DISPLAY_NAME?.trim() ||
    process.env.SEPAY_BANK_CODE?.trim() ||
    process.env.SEPAY_BANK_ID?.trim() ||
    ""
  )
}

export function getSepayDepositDetails(appointmentId: string, amount: number): SepayDepositDetails {
  return {
    qrUrl: generateSepayDepositQRImageUrl(appointmentId, amount),
    amount,
    addInfo: buildSepayTransferContent(appointmentId),
    bankName: sepayBankDisplayLabel(),
    accountNo: process.env.SEPAY_ACCOUNT_NO ?? "",
    accountName: process.env.SEPAY_ACCOUNT_NAME ?? "",
  }
}

export function isSepayDepositConfigured(): boolean {
  return Boolean(
    process.env.SEPAY_ACCOUNT_NO?.trim() &&
    (process.env.SEPAY_BANK_CODE?.trim() || process.env.SEPAY_BANK_ID?.trim()),
  )
}
