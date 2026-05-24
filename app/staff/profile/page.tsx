import { StaffShell } from "@/components/staff/StaffShell"
import { requireRole } from "@/lib/auth/require-role"
import { Initials } from "@/components/shared/InitialsAvatar"

const ROLE_LABELS: Record<string, string> = {
  STAFF: "Nhân viên",
  ADMIN: "Quản trị viên",
}

export default async function StaffProfilePage() {
  const { profile } = await requireRole(["STAFF", "ADMIN"])

  return (
    <StaffShell
      title="Hồ sơ cá nhân"
      description="Thông tin tài khoản"
      profileName={profile.fullName}
    >
      <div className="max-w-xl space-y-4">
        {/* Avatar + name card */}
        <div className="rounded-3xl border border-hairline-muted bg-white p-6">
          <div className="flex items-center gap-4">
            <Initials name={profile.fullName} size={64} />
            <div>
              <h2 className="text-xl font-bold text-ink">{profile.fullName}</h2>
              <span className="inline-flex items-center rounded-full bg-surface-card px-2.5 py-1 text-xs font-semibold text-body mt-1">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="rounded-3xl border border-hairline-muted bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Thông tin liên hệ
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Email" value={profile.email ?? "—"} />
            <InfoRow label="Số điện thoại" value={profile.phone ?? "—"} />
          </div>
        </div>
      </div>
    </StaffShell>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-4 border border-hairline-muted">
      <div className="text-xs font-medium uppercase tracking-wider text-muted mb-1">{label}</div>
      <div className="text-sm font-semibold text-ink">{value}</div>
    </div>
  )
}
