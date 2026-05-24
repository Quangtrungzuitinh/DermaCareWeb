export function RecordField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-soft">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-ink">{value}</div>
    </div>
  )
}
