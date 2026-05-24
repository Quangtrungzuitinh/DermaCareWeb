import Groq from "groq-sdk"
import { NextResponse } from "next/server"
import { handleBookingChat, shouldHandleBookingChat } from "@/lib/chatbot/booking"
import { formatRagContext, retrieveContext } from "@/lib/chatbot/rag"
import { logger } from "@/lib/logger"
import {
  buildClinicChatContext,
  buildGuestClinicContext,
  formatRecommendationContext,
  getCurrentChatProfile,
  scoreRecommendations,
} from "@/services/chatbot.service"

export const dynamic = "force-dynamic"

const MAX_MESSAGE_LENGTH = 1000
const ragRequiredPatterns = [
  "chăm sóc",
  "sau điều trị",
  "sau khi điều trị",
  "hậu điều trị",
  "kiêng gì",
  "bôi gì",
  "uống thuốc",
  "kê đơn",
  "chẩn đoán",
  "triệu chứng",
  "đỏ rát",
  "dị ứng",
]
const recommendationPatterns = [
  "gợi ý",
  "phù hợp",
  "nên khám",
  "nên chọn",
  "dịch vụ nào",
  "bác sĩ nào",
  "mụn",
  "da dầu",
  "nám",
  "tàn nhang",
  "sẹo",
  "rụng tóc",
  "lão hóa",
  "triệu chứng",
]

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thể xử lý yêu cầu chat."
}

function requiresRagContext(message: string) {
  const normalized = message.toLowerCase()
  return ragRequiredPatterns.some((pattern) => normalized.includes(pattern))
}

function isRecommendationRequest(message: string) {
  const normalized = message.toLowerCase()
  return recommendationPatterns.some((pattern) => normalized.includes(pattern))
}

function fallbackSymptoms(message: string) {
  const normalized = message.toLowerCase()
  const matched = recommendationPatterns
    .filter((pattern) => normalized.includes(pattern))
    .slice(0, 5)
  return matched.length ? matched : [message]
}

export async function POST(req: Request) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body không hợp lệ." }, { status: 400 })
  }

  const message =
    typeof body === "object" && body !== null && "message" in body ? body.message : null
  const sessionId =
    typeof body === "object" &&
    body !== null &&
    "sessionId" in body &&
    typeof body.sessionId === "string"
      ? body.sessionId
      : null
  const allowBooking =
    typeof body === "object" &&
    body !== null &&
    "allowBooking" in body &&
    body.allowBooking === true

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Vui lòng nhập nội dung cần hỏi." }, { status: 400 })
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự.` },
      { status: 400 },
    )
  }

  try {
    const trimmedMessage = message.trim()
    const profile = await getCurrentChatProfile()
    const isGuest = !profile

    if (await shouldHandleBookingChat(trimmedMessage, sessionId)) {
      if (!allowBooking) {
        return NextResponse.json({
          reply:
            "Tính năng đặt lịch qua chatbot chỉ dành cho người dùng đã đăng nhập. Hãy đăng nhập tài khoản bệnh nhân để sử dụng tính năng đặt lịch.",
          action: { label: "Đăng nhập", href: "/auth/login" },
        })
      }

      const result = await handleBookingChat(trimmedMessage, sessionId)
      return NextResponse.json(result)
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Chatbot chưa được cấu hình GROQ_API_KEY." },
        { status: 500 },
      )
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const isRecommendation = !isGuest && isRecommendationRequest(trimmedMessage)
    const needsRag = !isGuest && requiresRagContext(trimmedMessage) && !isRecommendation
    const [context, ragContexts, recommendations] = await Promise.all([
      isRecommendation
        ? Promise.resolve("Không dùng clinic context cho recommendation.")
        : isGuest
          ? buildGuestClinicContext()
          : buildClinicChatContext(),
      needsRag ? retrieveContext(trimmedMessage) : Promise.resolve([]),
      isRecommendation
        ? scoreRecommendations(fallbackSymptoms(trimmedMessage), new Date())
        : Promise.resolve([]),
    ])

    if (needsRag && ragContexts.length === 0) {
      return NextResponse.json({ reply: "Tôi không có thông tin về vấn đề này." })
    }

    const ragContext = formatRagContext(ragContexts)
    const recommendationContext = formatRecommendationContext(recommendations)
    const systemPrompt = isRecommendation
      ? `Bạn là trợ lý gợi ý dịch vụ của DermaCare Clinic.
Chỉ dùng RECOMMENDATION_CONTEXT bên dưới để trả lời.
Gợi ý tối đa 3 lựa chọn. Mỗi lựa chọn nêu: dịch vụ, giá, thời lượng, bác sĩ, slot gần nhất nếu có.
Không dùng bảng Markdown. Không tự đặt lịch. Không chẩn đoán bệnh hoặc kê đơn.
Nếu context không có gợi ý phù hợp, trả lời chính xác: "Tôi không có thông tin về vấn đề này."
Kết thúc bằng câu: "Thông tin chỉ mang tính hướng dẫn, không phải tư vấn y khoa."

RECOMMENDATION_CONTEXT:
${recommendationContext}`
      : isGuest
        ? `Bạn là trợ lý chatbot public của DermaCare Clinic, một phòng khám da liễu.
Chỉ trả lời các câu hỏi cơ bản dựa trên PUBLIC_CONTEXT bên dưới.
Với dịch vụ, chỉ nêu các dịch vụ nổi bật trong context; không nói đây là toàn bộ danh sách dịch vụ.
Với câu hỏi về đội ngũ bác sĩ, chỉ nêu các bác sĩ nổi bật trong context; không lộ email, số điện thoại hoặc dữ liệu nội bộ.
Không hỗ trợ đặt lịch, gợi ý cá nhân hóa, chẩn đoán, kê đơn hoặc hướng dẫn điều trị cho khách chưa đăng nhập.
Không mời khách đặt lịch qua chat; nếu cần nhắc đặt lịch, chỉ nói khách cần đăng nhập tài khoản bệnh nhân.
Nếu thiếu thông tin hoặc câu hỏi vượt quá phạm vi public, trả lời chính xác: "Tôi không có thông tin về vấn đề này."
Trả lời bằng tiếng Việt, ngắn gọn, thân thiện.

PUBLIC_CONTEXT:
${context}`
        : `Bạn là trợ lý chatbot của DermaCare Clinic, một phòng khám da liễu.
Chỉ trả lời dựa trên thông tin trong CLINIC_CONTEXT và RAG_CONTEXT bên dưới.
Ưu tiên RAG_CONTEXT khi câu hỏi liên quan đến chính sách, hướng dẫn chăm sóc hoặc kiến thức phòng khám.
Nếu cả hai context không có thông tin phù hợp, trả lời chính xác: "Tôi không có thông tin về vấn đề này."
Không bịa giá, lịch, tên bác sĩ hoặc chính sách.
Không chẩn đoán bệnh, không kê đơn, không thay thế tư vấn y tế trực tiếp.
Với mọi câu trả lời có nội dung hướng dẫn chăm sóc hoặc thông tin y tế, thêm câu: "Thông tin chỉ mang tính hướng dẫn, không phải tư vấn y khoa."
Trả lời bằng tiếng Việt, ngắn gọn, thân thiện.

CLINIC_CONTEXT:
${context}

RAG_CONTEXT:
${ragContext}`
    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
      max_tokens: isRecommendation ? 512 : 768,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: trimmedMessage },
      ],
    })

    const reply = response.choices[0]?.message?.content?.trim()

    return NextResponse.json({
      reply: reply || "Tôi không có thông tin về vấn đề này.",
    })
  } catch (error) {
    logger.error("[chatbot] Groq request failed", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
