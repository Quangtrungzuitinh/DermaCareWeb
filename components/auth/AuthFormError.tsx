export function AuthFormError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
      {message}
    </div>
  )
}
