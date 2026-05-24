"use client"

type InitialsProps = {
  name: string
  size?: number
  bg?: string
  fg?: string
}

export function Initials({
  name,
  size = 36,
  bg = "var(--color-primary-light)",
  fg = "var(--color-primary)",
}: InitialsProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <div
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: fg,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  )
}
