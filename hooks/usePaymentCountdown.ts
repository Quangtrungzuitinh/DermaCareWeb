import { useState, useEffect } from "react"

const TIMEOUT_MS = 15 * 60 * 1000

export function usePaymentCountdown(createdAt: Date | string) {
  const [remaining, setRemaining] = useState(TIMEOUT_MS)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const start = new Date(createdAt).getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const elapsed = now - start
      const timeLeft = TIMEOUT_MS - elapsed

      if (timeLeft <= 0) {
        setRemaining(0)
        setIsExpired(true)
        clearInterval(timer)
      } else {
        setRemaining(timeLeft)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [createdAt])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return {
    minutes,
    seconds,
    remaining,
    isExpired,
  }
}
