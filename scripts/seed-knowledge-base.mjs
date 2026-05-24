import "dotenv/config"
import dotenv from "dotenv"
import pg from "pg"

dotenv.config({ path: ".env.local" })

const documents = [
  {
    category: "policy",
    title: "Chính sách đặt lịch và đổi lịch",
    content:
      "Bệnh nhân có thể đặt lịch trên website bằng cách chọn dịch vụ, bác sĩ và khung giờ phù hợp. Nếu cần đổi lịch hoặc hủy lịch, bệnh nhân nên liên hệ nhân viên phòng khám để được hỗ trợ kiểm tra trạng thái lịch hẹn và phương án xử lý phù hợp.",
    metadata: { source: "phase2_seed" },
  },
  {
    category: "policy",
    title: "Hướng dẫn thanh toán lịch hẹn",
    content:
      "Hệ thống hỗ trợ thanh toán chuyển khoản bằng mã QR SePay. Một số lịch hẹn có thể cho phép thanh toán tại phòng khám tùy theo thiết lập của hệ thống. Bệnh nhân nên kiểm tra màn hình xác nhận hoặc trang thanh toán của lịch hẹn.",
    metadata: { source: "phase2_seed" },
  },
  {
    category: "aftercare",
    title: "Chăm sóc da sau điều trị mụn",
    content:
      "Sau buổi điều trị mụn, bệnh nhân nên giữ da sạch, tránh tự nặn mụn, hạn chế trang điểm dày trong ngày đầu và sử dụng kem chống nắng khi ra ngoài. Nếu da đỏ rát kéo dài hoặc có dấu hiệu bất thường, bệnh nhân nên liên hệ phòng khám để được hướng dẫn.",
    metadata: { source: "phase2_seed", topic: "acne" },
  },
  {
    category: "aftercare",
    title: "Chăm sóc da sau laser hoặc peel",
    content:
      "Sau laser hoặc chemical peel, da có thể nhạy cảm hơn bình thường. Bệnh nhân nên tránh nắng trực tiếp, không tẩy da chết mạnh, không dùng hoạt chất treatment khi chưa được hướng dẫn và ưu tiên dưỡng ẩm phục hồi. Thông tin này chỉ mang tính hướng dẫn, không thay thế tư vấn của bác sĩ.",
    metadata: { source: "phase2_seed", topic: "laser_peel" },
  },
  {
    category: "service",
    title: "Tư vấn chọn dịch vụ da liễu",
    content:
      "Nếu chưa biết chọn dịch vụ nào, bệnh nhân nên bắt đầu bằng khám da liễu tổng quát hoặc tư vấn với bác sĩ. Bác sĩ sẽ đánh giá tình trạng da và đề xuất dịch vụ phù hợp như điều trị mụn, laser, peel, chăm sóc da cơ bản hoặc các liệu trình chuyên sâu khác.",
    metadata: { source: "phase2_seed" },
  },
  {
    category: "faq",
    title: "Giới hạn tư vấn của chatbot",
    content:
      "Chatbot chỉ hỗ trợ thông tin chung về phòng khám, dịch vụ, lịch làm việc, chính sách và hướng dẫn chăm sóc cơ bản. Chatbot không chẩn đoán bệnh, không kê đơn và không thay thế tư vấn y tế trực tiếp từ bác sĩ.",
    metadata: { source: "phase2_seed" },
  },
]

function vectorLiteral(embedding) {
  return `[${embedding.join(",")}]`
}

async function embedPassage(text) {
  const baseUrl = process.env.EMBEDDING_SERVICE_URL
  if (!baseUrl) {
    throw new Error("Missing EMBEDDING_SERVICE_URL")
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: [text], type: "passage" }),
  })

  if (!response.ok) {
    throw new Error(`Embedding service error: ${response.status}`)
  }

  const data = await response.json()
  if (data.dimension !== 1024 || !data.vectors?.[0]) {
    throw new Error(`Unexpected embedding dimension: ${data.dimension}`)
  }

  return data.vectors[0]
}

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("Missing DIRECT_URL or DATABASE_URL")
  }

  const pool = new pg.Pool({ connectionString })
  const client = await pool.connect()

  try {
    for (const doc of documents) {
      const embedding = await embedPassage(`${doc.title}\n${doc.content}`)
      const vector = vectorLiteral(embedding)

      await client.query(
        `
          INSERT INTO knowledge_base (id, category, title, content, metadata, "isActive", "createdAt", embedding)
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4::jsonb, true, NOW(), $5::vector)
          ON CONFLICT (title) DO UPDATE SET
            category = EXCLUDED.category,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            "isActive" = true,
            embedding = EXCLUDED.embedding
        `,
        [doc.category, doc.title, doc.content, JSON.stringify(doc.metadata), vector],
      )

      console.log(`Seeded: ${doc.title}`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
