export function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-hairline-soft pt-2 first:border-t-0 first:pt-0">
      <span className="text-muted">{label}</span>
      <span className={`text-right ${strong ? "font-bold text-ink" : "font-semibold text-body"}`}>
        {value}
      </span>
    </div>
  )
}
