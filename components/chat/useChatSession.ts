"use client"

import { FormEvent, useState } from "react"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  action?: {
    label: string
    href: string
  }
}

type ChatResponse = {
  reply?: string
  error?: string
  sessionId?: string
  action?: { label: string; href: string }
}

export function useChatSession({
  initialMessages,
  allowBooking,
}: {
  initialMessages: ChatMessage[]
  allowBooking?: boolean
}) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = input.trim()
    if (!text || isSending) return

    setMessages((current) => [...current, buildMessage("user", text)])
    setInput("")
    setError(null)
    setIsSending(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, allowBooking }),
      })
      const data = (await response.json()) as ChatResponse

      if (!response.ok) {
        throw new Error(data.error || "Chatbot đang tạm thời không phản hồi.")
      }

      if (data.sessionId) {
        setSessionId(data.sessionId)
      }

      setMessages((current) => [
        ...current,
        buildMessage(
          "assistant",
          data.reply || "Tôi không có thông tin về vấn đề này.",
          data.action,
        ),
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chatbot đang tạm thời không phản hồi."
      setError(message)
      setMessages((current) => [
        ...current,
        buildMessage("assistant", "Xin lỗi, tôi chưa thể trả lời lúc này. Vui lòng thử lại sau."),
      ])
    } finally {
      setIsSending(false)
    }
  }

  return {
    input,
    setInput,
    messages,
    isSending,
    error,
    submitMessage,
  }
}

function buildMessage(
  role: ChatMessage["role"],
  content: string,
  action?: ChatMessage["action"],
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    action,
  }
}
