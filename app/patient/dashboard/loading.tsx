export default function PatientDashboardLoading() {
  return (
    <div className="min-h-screen bg-surface-soft p-4 md:p-6">
      <div className="space-y-6">
        <div className="h-12 w-72 rounded-2xl bg-hairline" />
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            {[120, 76, 76, 76, 180].map((height, index) => (
              <div
                key={index}
                className="rounded-3xl border border-hairline-muted bg-white"
                style={{ height }}
              />
            ))}
          </div>
          <div className="lg:col-span-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-[300px] rounded-3xl border border-hairline-muted bg-white" />
              <div className="h-[300px] rounded-3xl border border-hairline-muted bg-white" />
            </div>
            <div className="h-[320px] rounded-3xl border border-hairline-muted bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
