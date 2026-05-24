"use client"

import { useRef, useState } from "react"
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react"

import { useChatSession, type ChatMessage } from "@/components/chat/useChatSession"

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào, tôi có thể hỗ trợ thông tin về dịch vụ, bác sĩ và lịch làm việc của phòng khám.",
}

export function ChatWidget({ allowBooking = false }: { allowBooking?: boolean }) {
  const [open, setOpen] = useState(false)
  const { input, setInput, messages, isSending, error, submitMessage } = useChatSession({
    initialMessages: [welcomeMessage],
    allowBooking,
  })
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleToggle = () => {
    setOpen((current) => {
      const next = !current
      if (!current) {
        window.setTimeout(() => inputRef.current?.focus(), 50)
      }
      return next
    })
  }

  return (
    <div className="fixed bottom-5 right-5 z-[240] flex flex-col items-end gap-3 max-md:bottom-[76px] max-md:right-4">
      {open && (
        <div className="flex h-[min(620px,calc(100vh-112px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-[28px] border border-hairline bg-white shadow-modal">
          <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-hairline bg-white px-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-bold text-ink">DermaCare Chat</div>
                <div className="truncate text-[12px] text-muted">Hỗ trợ thông tin phòng khám</div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Đóng chatbot"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-card hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-surface-soft px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={`max-w-[78%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-card ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "border border-hairline bg-white text-ink"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  {message.action && (
                    <a
                      href={message.action.href}
                      className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover"
                    >
                      {message.action.label}
                    </a>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-2 rounded-[22px] border border-hairline bg-white px-4 py-3 text-sm text-muted shadow-card">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang suy nghĩ...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={submitMessage} className="shrink-0 border-t border-hairline bg-white p-4">
            {error && (
              <div className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-medium text-danger">
                {error}
              </div>
            )}
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
                placeholder="Nhập câu hỏi..."
                maxLength={1000}
                rows={2}
                className="min-h-11 flex-1 resize-none rounded-2xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted-soft focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-surface-soft"
                disabled={isSending}
              />
              <button
                type="submit"
                aria-label="Gửi tin nhắn"
                disabled={isSending || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white transition hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Đóng chatbot" : "Mở chatbot"}
        onClick={handleToggle}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-modal transition hover:-translate-y-0.5 hover:bg-primary-hover"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}
