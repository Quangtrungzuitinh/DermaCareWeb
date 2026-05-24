"use client"

import { CreateServiceDialog } from "@/components/admin/services/CreateServiceDialog"
import { ServiceTable } from "@/components/admin/services/ServiceTable"
import { ServiceToolbar } from "@/components/admin/services/ServiceToolbar"
import { useServiceDirectoryState } from "@/components/admin/services/useServiceDirectoryState"
import { ListPagination } from "@/components/shared/ListPagination"
import type { UiService } from "@/services/clinic.types"

interface Props {
  services: UiService[]
  createAction: (formData: FormData) => Promise<void>
  toggleAction: (formData: FormData) => Promise<void>
}

export function AdminServicesClient({ services, createAction, toggleAction }: Props) {
  const directory = useServiceDirectoryState(services)

  return (
    <div className="space-y-5">
      <CreateServiceDialog
        open={directory.showCreate}
        createAction={createAction}
        onOpenChange={directory.setShowCreate}
      />

      <div className="rounded-3xl border border-hairline-muted bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
        <ServiceToolbar
          activeCount={directory.activeCount}
          filterStatus={directory.filterStatus}
          hiddenCount={directory.hiddenCount}
          query={directory.query}
          serviceCount={services.length}
          sort={directory.sort}
          onCreateClick={() => directory.setShowCreate(true)}
          onFilterStatusChange={directory.setFilterStatus}
          onQueryChange={directory.setQuery}
          onSortChange={directory.setSort}
        />

        <ServiceTable
          services={directory.visibleServices}
          total={directory.filtered.length}
          toggleAction={toggleAction}
        />

        <ListPagination
          total={directory.filtered.length}
          page={directory.currentPage}
          pageSize={directory.pageSize}
          onPageChange={directory.setPage}
          onPageSizeChange={directory.setPageSize}
          itemLabel="dịch vụ"
        />
      </div>
    </div>
  )
}
