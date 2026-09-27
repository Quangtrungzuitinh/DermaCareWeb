export type DemoRole = "PATIENT" | "STAFF" | "DOCTOR" | "ADMIN"

export const DEMO_ACCOUNTS: Array<{ role: DemoRole; label: string; email: string; password: string }> = [
  { role: "PATIENT", label: "Bệnh nhân", email: "demo.patient@clinic.test", password: "DemoRole!2026" },
  { role: "STAFF", label: "Nhân viên", email: "demo.staff@clinic.test", password: "DemoRole!2026" },
  { role: "DOCTOR", label: "Bác sĩ", email: "demo.doctor@clinic.test", password: "DemoRole!2026" },
  { role: "ADMIN", label: "Quản trị viên", email: "demo.admin@clinic.test", password: "DemoRole!2026" },
]
