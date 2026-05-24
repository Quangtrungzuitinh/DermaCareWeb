interface RouteLoadingStateProps {
  titleWidth?: string
  statCards?: number
  rows?: number
  showSidePanel?: boolean
}

export function RouteLoadingState({
  titleWidth = "w-72",
  statCards = 0,
  rows = 5,
  showSidePanel = false,
}: RouteLoadingStateProps) {
  return (
    <div className="min-h-screen bg-[#f7f9fc] p-4 md:p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className={`h-8 ${titleWidth} max-w-full rounded-2xl bg-[#e2e8f0]`} />
          <div className="h-4 w-56 rounded-full bg-[#e2e8f0]" />
        </div>

        {statCards > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: statCards }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl border border-[#eef2f7] bg-white" />
            ))}
          </div>
        )}

        <div className={showSidePanel ? "grid gap-5 lg:grid-cols-[1fr_320px]" : ""}>
          <div className="rounded-2xl border border-[#eef2f7] bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="h-5 w-40 rounded-full bg-[#e2e8f0]" />
              <div className="h-9 w-32 rounded-full bg-[#e2e8f0]" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: rows }).map((_, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-[#f1f5f9] p-4 md:grid-cols-[1.3fr_1fr_120px]"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded-full bg-[#e2e8f0]" />
                    <div className="h-3 w-56 max-w-full rounded-full bg-[#f0f4f8]" />
                  </div>
                  <div className="h-4 w-32 rounded-full bg-[#e2e8f0]" />
                  <div className="h-7 w-24 rounded-full bg-[#e2e8f0]" />
                </div>
              ))}
            </div>
          </div>

          {showSidePanel && <div className="h-80 rounded-2xl border border-[#eef2f7] bg-white" />}
        </div>
      </div>
    </div>
  )
}
