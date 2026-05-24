"use client"

import { useEffect, useRef } from "react"
import { Bot, Loader2, Send } from "lucide-react"

import { useChatSession } from "@/components/chat/useChatSession"

export function PatientChatClient() {
  const { input, setInput, messages, isSending, error, submitMessage } = useChatSession({
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Xin chào! 👋 Tôi là trợ lý chatbot của DermaCare Clinic. Tôi có thể giúp bạn:\n\n• 💊 Trả lời câu hỏi về dịch vụ, bác sĩ, giá cả\n• 📅 Gợi ý dịch vụ phù hợp với triệu chứng của bạn\n• 🎫 Đặt lịch khám trực tiếp\n• 📋 Hướng dẫn chăm sóc sau điều trị\n\nBạn muốn hỏi gì?",
      },
    ],
    allowBooking: true,
  })
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col gap-4 rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-hairline bg-[#f8fafc] px-6 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-white">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <div className="font-bold text-ink">DermaCare Chat Assistant</div>
          <div className="text-xs text-muted">Hỗ trợ 24/7 • Phản hồi tức thì</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-surface-soft px-6 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-primary text-white"
                  : "border border-hairline bg-white text-ink"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={submitMessage}
        className="shrink-0 border-t border-hairline bg-white px-6 py-4"
      >
        {error && <div className="mb-3 text-xs font-medium text-danger">❌ {error}</div>}
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
            placeholder="Nhập câu hỏi của bạn... (Shift+Enter để xuống dòng)"
            maxLength={1000}
            rows={2}
            className="min-h-11 flex-1 resize-none rounded-lg border border-[#dbe3ee] px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted-soft focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-[#f5f5f5]"
            disabled={isSending}
          />
          <button
            type="submit"
            aria-label="Gửi tin nhắn"
            disabled={isSending || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
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
  )
}
