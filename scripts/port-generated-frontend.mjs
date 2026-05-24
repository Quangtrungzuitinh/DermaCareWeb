import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const sourceDir = path.join(root, "project (2)/src/routes")

const routes = [
  ["patient.dashboard.tsx", "app/patient/dashboard/page.tsx"],
  ["patient.appointments.tsx", "app/patient/appointments/page.tsx"],
  ["patient.doctors.tsx", "app/patient/doctors/page.tsx"],
  ["patient.records.tsx", "app/patient/records/page.tsx"],
  ["patient.settings.tsx", "app/patient/settings/page.tsx"],
  ["patient.booking.select.tsx", "app/patient/booking/select/page.tsx"],
  ["patient.booking.confirm.tsx", "app/patient/booking/confirm/page.tsx"],
  ["patient.booking.payment.tsx", "app/patient/booking/payment/page.tsx"],
  ["staff.dashboard.tsx", "app/staff/dashboard/page.tsx"],
  ["staff.appointments.tsx", "app/staff/appointments/page.tsx"],
  ["staff.appointments.new.tsx", "app/staff/appointments/new/page.tsx"],
  ["staff.medical-records.tsx", "app/staff/medical-records/page.tsx"],
  ["staff.patients.tsx", "app/staff/patients/page.tsx"],
  ["staff.payments.tsx", "app/staff/payments/page.tsx"],
  ["staff.profile.tsx", "app/staff/profile/page.tsx"],
  ["staff.schedule.tsx", "app/staff/schedule/page.tsx"],
  ["doctor.index.tsx", "app/doctor/page.tsx"],
  ["doctor.appointments.tsx", "app/doctor/appointments/page.tsx"],
  ["doctor.medical-records.tsx", "app/doctor/medical-records/page.tsx"],
  ["doctor.schedule.tsx", "app/doctor/schedule/page.tsx"],
  ["doctor.services.tsx", "app/doctor/services/page.tsx"],
]

function stripRouteDeclaration(code) {
  const match = code.match(
    /export const Route = createFileRoute[\s\S]*?component:\s*([A-Za-z0-9_]+),?\s*}\);/,
  )
  if (!match) throw new Error("Cannot find route declaration")
  return {
    code: code.replace(match[0], `export default ${match[1]};`),
    component: match[1],
  }
}

function commonTransforms(code) {
  code = code.replace(
    /import\s*\{([^}]*)\}\s*from\s*"@tanstack\/react-router";\n/g,
    (_m, names) => {
      const kept = names
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name && !["createFileRoute", "notFound"].includes(name))
      return kept.length
        ? `import { ${kept.join(", ")} } from "@/components/navigation-link";\n`
        : ""
    },
  )
  code = code.replace(/import\s+\w+Logo\s+from\s+"@\/assets\/[^"]+";\n/g, "")
  code = code.replace(/zaloLogo/g, '"ZaloPay"')
  code = code.replace(/momoLogo/g, '"MoMo"')
  code = code.replace(/vietqrLogo/g, '"VietQR"')
  code = code.replace(/nav\(\{\s*to:\s*"([^"]+)"\s*\}\)/g, 'nav({ to: "$1" })')
  code = code.replace(/navigate\(\{\s*to:\s*"([^"]+)"\s*\}\)/g, 'navigate({ to: "$1" })')
  if (!code.startsWith('"use client"')) code = `"use client"\n\n${code}`
  return code
}

for (const [srcName, destName] of routes) {
  const src = path.join(sourceDir, srcName)
  const dest = path.join(root, destName)
  let code = fs.readFileSync(src, "utf8")
  code = commonTransforms(code)
  code = stripRouteDeclaration(code).code
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, code)
}

function dynamicAppointment() {
  let code = fs.readFileSync(path.join(sourceDir, "staff.appointments.$appointmentId.tsx"), "utf8")
  code = commonTransforms(code)
  code = code.replace(
    /export const Route[\s\S]*?\nfunction AppointmentDetail\(\) \{/,
    "export default function AppointmentDetail({ params }: { params: { appointmentId: string } }) {",
  )
  code = code.replace(
    /const a = Route\.useLoaderData\(\) as Appointment;/,
    'const a = appointments.find((x) => x.id === params.appointmentId) as Appointment | undefined;\n  if (!a) return <StaffShell title="Không tìm thấy"><div className="text-sm text-[#64748b]">Lịch hẹn không tồn tại.</div></StaffShell>;',
  )
  fs.mkdirSync(path.join(root, "app/staff/appointments/[appointmentId]"), { recursive: true })
  fs.writeFileSync(path.join(root, "app/staff/appointments/[appointmentId]/page.tsx"), code)
}

function dynamicPatient() {
  let code = fs.readFileSync(path.join(sourceDir, "staff.patients.$patientId.tsx"), "utf8")
  code = commonTransforms(code)
  code = code.replace(
    /export const Route[\s\S]*?\nfunction PatientDetail\(\) \{/,
    "export default function PatientDetail({ params }: { params: { patientId: string } }) {",
  )
  code = code.replace(
    /const p = Route\.useLoaderData\(\);/,
    'const p = allPatients.find((x) => x.id === params.patientId);\n  if (!p) return <StaffShell title="Không tìm thấy"><div className="text-sm text-[#64748b]">Bệnh nhân không tồn tại.</div></StaffShell>;',
  )
  fs.mkdirSync(path.join(root, "app/staff/patients/[patientId]"), { recursive: true })
  fs.writeFileSync(path.join(root, "app/staff/patients/[patientId]/page.tsx"), code)
}

dynamicAppointment()
dynamicPatient()

fs.mkdirSync(path.join(root, "app/staff"), { recursive: true })
fs.writeFileSync(
  path.join(root, "app/staff/page.tsx"),
  'import { redirect } from "next/navigation"\n\nexport default function StaffIndex() {\n  redirect("/staff/dashboard")\n}\n',
)
fs.mkdirSync(path.join(root, "app/patient"), { recursive: true })
fs.writeFileSync(
  path.join(root, "app/patient/page.tsx"),
  'import { redirect } from "next/navigation"\n\nexport default function PatientIndex() {\n  redirect("/patient/dashboard")\n}\n',
)
