"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CreateServiceDialog({
  open,
  createAction,
  onOpenChange,
}: {
  open: boolean
  createAction: (formData: FormData) => Promise<void>
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-hairline-muted p-0 sm:max-w-2xl">
        <form
          action={async (fd) => {
            await createAction(fd)
            onOpenChange(false)
          }}
        >
          <div className="border-b border-hairline-muted px-6 py-5">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="pr-8 text-xl font-bold text-ink">
                Thêm dịch vụ mới
              </DialogTitle>
              <DialogDescription className="text-muted">
                Tạo dịch vụ mới cho danh mục đặt lịch và điều trị.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <ServiceField
              name="name"
              label="Tên dịch vụ"
              placeholder="VD: Laser tẩy nám"
              required
            />
            <ServiceField
              name="price"
              label="Giá (VND)"
              type="number"
              min={10000}
              placeholder="500000"
              required
            />
            <ServiceField
              name="durationMinutes"
              label="Thời lượng (phút)"
              type="number"
              min={15}
              defaultValue={30}
            />
            <ServiceField name="description" label="Mô tả" placeholder="Tùy chọn" />
          </div>

          <div className="flex items-center gap-2 border-t border-hairline-muted px-6 py-4">
            <button
              type="submit"
              className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Tạo
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-full border border-hairline px-5 text-sm font-semibold text-body transition hover:bg-surface-card"
            >
              Huỷ
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ServiceField({
  label,
  ...inputProps
}: {
  name: string
  label: string
  type?: string
  min?: number
  defaultValue?: number
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm text-body">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        {...inputProps}
        className="h-11 w-full rounded-xl border border-hairline px-3 text-sm focus:border-primary focus:outline-none"
      />
    </label>
  )
}
