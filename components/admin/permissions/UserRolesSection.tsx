"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ListPagination, type PageSize } from "@/components/shared/ListPagination"
import { SortButton, type SortOption } from "@/components/shared/SortButton"
import type { Role } from "@/lib/generated/prisma"
import type { UiProfile } from "@/services/clinic.types"

const ALL_ROLES: Role[] = ["PATIENT", "DOCTOR", "STAFF", "ADMIN"]
const ROLE_LABELS: Record<Role, string> = {
  PATIENT: "Bệnh nhân",
  DOCTOR: "Bác sĩ",
  STAFF: "Nhân viên",
  ADMIN: "Quản trị",
}

type PermissionSort = "name" | "role" | "email" | "newest"

const PERMISSION_SORT_OPTIONS: SortOption<PermissionSort>[] = [
  { value: "name", label: "Tên người dùng" },
  { value: "role", label: "Vai trò" },
  { value: "email", label: "Email" },
  { value: "newest", label: "Mới tạo" },
]

type PendingRoleChange = {
  profileId: string
  fullName: string
  currentRole: Role
  nextRole: Role
} | null

function getEmailDisplay(user: { email: string | null; phone: string | null }) {
  return user.email?.trim() || user.phone?.trim() || "Chưa có email"
}

export function UserRolesSection({
  users,
  updateRoleAction,
}: {
  users: UiProfile[]
  updateRoleAction: (formData: FormData) => Promise<void>
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<PermissionSort>("name")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange>(null)
  const [roleFilter, setRoleFilter] = useState<Role | null>(null)
  const [isUpdatingRole, startRoleTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let source = roleFilter ? users.filter((u) => u.role === roleFilter) : users
    if (q) {
      source = source.filter((user) => {
        const haystack = [
          user.fullName,
          user.email,
          user.phone,
          ROLE_LABELS[user.role],
          user.province,
          user.district,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return haystack.includes(q)
      })
    }
    return source.slice().sort((a, b) => {
      if (sort === "role") return ROLE_LABELS[a.role].localeCompare(ROLE_LABELS[b.role], "vi")
      if (sort === "email") return getEmailDisplay(a).localeCompare(getEmailDisplay(b), "vi")
      if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt)
      return a.fullName.localeCompare(b.fullName, "vi")
    })
  }, [query, sort, roleFilter, users])

  useEffect(() => {
    setPage(1)
  }, [query, sort, pageSize, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function requestRoleChange(user: UiProfile, formData: FormData) {
    const nextRole = String(formData.get("role")) as Role
    if (nextRole === user.role) return
    setPendingRoleChange({
      profileId: user.id,
      fullName: user.fullName,
      currentRole: user.role,
      nextRole,
    })
  }

  function confirmRoleChange() {
    if (!pendingRoleChange) return
    const formData = new FormData()
    formData.set("profileId", pendingRoleChange.profileId)
    formData.set("role", pendingRoleChange.nextRole)

    startRoleTransition(async () => {
      await updateRoleAction(formData)
      setPendingRoleChange(null)
      router.refresh()
    })
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, email, SĐT..."
              className="h-11 w-full rounded-full border border-hairline bg-white pl-9 pr-4 text-sm text-ink placeholder:text-muted-soft shadow-[0_1px_3px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
            />
          </div>
          <SortButton
            value={sort}
            options={PERMISSION_SORT_OPTIONS}
            onChange={setSort}
            label="Sắp xếp phân quyền"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRoleFilter(null)}
            className={`h-8 rounded-full px-4 text-xs font-semibold transition ${
              roleFilter === null
                ? "bg-ink text-white"
                : "bg-hairline-soft text-[#475569] hover:bg-hairline"
            }`}
          >
            Tất cả
          </button>
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(roleFilter === role ? null : role)}
              className={`h-8 rounded-full px-4 text-xs font-semibold transition ${
                roleFilter === role
                  ? role === "ADMIN"
                    ? "bg-[#0f2a3f] text-white"
                    : role === "DOCTOR"
                      ? "bg-primary text-white"
                      : role === "STAFF"
                        ? "bg-[#d97706] text-white"
                        : "bg-[#475569] text-white"
                  : "bg-hairline-soft text-[#475569] hover:bg-hairline"
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-hairline-muted bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-soft text-left text-[11px] uppercase tracking-wider text-muted-soft">
                <th className="px-5 py-3 font-medium">Tên</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">SĐT</th>
                <th className="px-5 py-3 font-medium">Vai trò hiện tại</th>
                <th className="px-5 py-3 text-right font-medium">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {visibleUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-soft">
                  <td className="px-5 py-4 font-semibold text-ink">{user.fullName}</td>
                  <td className="px-5 py-4 text-[#475569]">{getEmailDisplay(user)}</td>
                  <td className="hidden px-5 py-4 text-[#475569] sm:table-cell">
                    {user.phone ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <RolePill role={user.role} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form
                      action={(formData) => requestRoleChange(user, formData)}
                      className="inline-flex items-center gap-2"
                    >
                      <input type="hidden" name="profileId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        aria-label={`Vai trò của ${user.fullName}`}
                        className="h-9 rounded-full border border-hairline bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none"
                      >
                        {ALL_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="h-9 rounded-full bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover"
                      >
                        Lưu
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted">
                    Không tìm thấy tài khoản phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ListPagination
          total={filtered.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="tài khoản"
        />
      </div>

      <AlertDialog
        open={Boolean(pendingRoleChange)}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
      >
        <AlertDialogContent className="rounded-3xl border border-hairline-muted bg-white p-0 shadow-[0_18px_60px_rgba(15,23,42,0.16)] sm:max-w-md">
          <div className="p-5">
            <AlertDialogHeader className="place-items-start gap-2 text-left">
              <AlertDialogTitle className="text-lg font-bold text-ink">
                Xác nhận đổi quyền
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-muted">
                {pendingRoleChange ? (
                  <>
                    Bạn đang đổi quyền của{" "}
                    <span className="font-semibold text-ink">{pendingRoleChange.fullName}</span> từ{" "}
                    <span className="font-semibold text-ink">
                      {ROLE_LABELS[pendingRoleChange.currentRole]}
                    </span>{" "}
                    sang{" "}
                    <span className="font-semibold text-primary">
                      {ROLE_LABELS[pendingRoleChange.nextRole]}
                    </span>
                    . Hệ thống sẽ gửi notification cho tài khoản này sau khi cập nhật.
                  </>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="m-0 flex-row justify-end gap-2 rounded-b-3xl border-t border-hairline-muted bg-surface-soft p-4">
            <AlertDialogCancel
              disabled={isUpdatingRole}
              className="h-10 rounded-full border border-hairline bg-white px-5 text-sm font-semibold text-[#475569] transition hover:bg-hairline-soft"
            >
              Không
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isUpdatingRole}
              onClick={confirmRoleChange}
              className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
            >
              {isUpdatingRole ? "Đang lưu..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function RolePill({ role }: { role: Role }) {
  const className =
    role === "ADMIN"
      ? "bg-[#0f2a3f] text-white"
      : role === "DOCTOR"
        ? "bg-primary-light text-[#1e3a8a]"
        : role === "STAFF"
          ? "bg-[#fef3c7] text-[#92400e]"
          : "bg-hairline-soft text-[#475569]"

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
