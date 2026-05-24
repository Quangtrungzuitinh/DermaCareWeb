import { AdminShell } from "@/components/admin/AdminShell"
import { requireRole } from "@/lib/auth/require-role"
import { getServices } from "@/services/clinic.service"
import { createService, updateService } from "@/lib/actions/admin.actions"
import { AdminServicesClient } from "./AdminServicesClient"

export default async function AdminServicesPage() {
  const { profile } = await requireRole(["ADMIN"])
  const services = await getServices()

  async function createAction(formData: FormData) {
    "use server"
    await createService({
      name: String(formData.get("name") ?? ""),
      price: Number(formData.get("price") ?? 0),
      durationMinutes: Number(formData.get("durationMinutes") ?? 30),
      description: String(formData.get("description") ?? "") || undefined,
    })
  }

  async function toggleAction(formData: FormData) {
    "use server"
    await updateService({
      id: String(formData.get("id")),
      isActive: String(formData.get("isActive")) !== "true",
    })
  }

  return (
    <AdminShell
      title="Danh mục dịch vụ"
      description="Quản lý tên, giá, thời lượng. Lịch sử Treatment giữ snapshot priceAtTime và không bị ảnh hưởng."
      profileName={profile.fullName}
    >
      <AdminServicesClient
        services={services}
        createAction={createAction}
        toggleAction={toggleAction}
      />
    </AdminShell>
  )
}
