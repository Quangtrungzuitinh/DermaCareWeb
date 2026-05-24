import { PatientShell } from "@/components/patient/PatientShell"
import { updateProfile } from "@/lib/actions/profile.actions"
import { requireRole } from "@/lib/auth/require-role"
import type { ReactNode } from "react"

export default async function PatientSettingsPage() {
  const { profile } = await requireRole(["PATIENT"])

  async function updateAction(formData: FormData) {
    "use server"
    const birthYearValue = String(formData.get("birthYear") ?? "")
    await updateProfile({
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? "") || undefined,
      birthYear: birthYearValue ? Number(birthYearValue) : undefined,
      province: String(formData.get("province") ?? "") || undefined,
      district: String(formData.get("district") ?? "") || undefined,
    })
  }

  return (
    <PatientShell
      title="Cài đặt"
      description="Cập nhật thông tin tài khoản và tuỳ chọn nhận thông báo"
      profile={profile}
    >
      <form
        action={updateAction}
        className="max-w-2xl rounded-3xl border border-hairline-muted bg-white p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Họ tên">
            <input
              name="fullName"
              defaultValue={profile.fullName}
              required
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
          <Field label="SĐT">
            <input
              name="phone"
              defaultValue={profile.phone ?? ""}
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
          <Field label="Năm sinh">
            <input
              name="birthYear"
              type="number"
              defaultValue={profile.birthYear ?? ""}
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
          <Field label="Tỉnh/Thành">
            <input
              name="province"
              defaultValue={profile.province ?? ""}
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
          <Field label="Quận/Huyện">
            <input
              name="district"
              defaultValue={profile.district ?? ""}
              className="h-11 w-full rounded-xl border border-hairline px-3"
            />
          </Field>
        </div>
        <button className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          Lưu thay đổi
        </button>
      </form>
    </PatientShell>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-body">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  )
}
