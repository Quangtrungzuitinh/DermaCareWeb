const TESTIMONIALS = [
  {
    id: 1,
    stars: 5,
    text: '"Tôi đã điều trị mụn ở nhiều nơi nhưng chỉ ở DermaCare mới thấy kết quả rõ ràng sau 2 tháng. Bác sĩ An rất tận tâm và giải thích chi tiết."',
    initial: "M",
    name: "Minh Thư",
    meta: "Khách hàng thường xuyên · 6 tháng",
  },
  {
    id: 2,
    stars: 5,
    text: '"Đặt lịch qua app rất tiện, chờ không lâu. Phòng khám sạch sẽ, bác sĩ chuyên nghiệp. Sẽ giới thiệu cho bạn bè."',
    initial: "H",
    name: "Hoàng Nam",
    meta: "Bệnh nhân · 3 tháng trước",
  },
  {
    id: 3,
    stars: 4,
    text: '"Liệu trình trẻ hóa da của BS. Bích thật sự ấn tượng. Da mình săn chắc hơn rõ rệt sau 4 buổi laser. Giá cả hợp lý."',
    initial: "L",
    name: "Lan Phương",
    meta: "Khách hàng mới · 1 tháng trước",
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-surface-soft py-20 px-[5%]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[30px] font-[800] text-ink text-center tracking-[-0.5px] mb-2">
          Bệnh nhân nói gì
        </h2>
        <p className="text-[15px] text-muted text-center mb-12 leading-[1.6]">
          Những chia sẻ từ bệnh nhân sau khi điều trị tại DermaCare
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item) => (
            <div key={item.id} className="rounded-xl border border-hairline bg-white p-6">
              <div className="text-amber-500 text-[14px] mb-3">
                {"★".repeat(item.stars)}
                {"☆".repeat(5 - item.stars)}
              </div>

              <div className="text-[14px] text-body leading-[1.7] mb-4 italic">{item.text}</div>

              <div className="flex items-center gap-[10px]">
                <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                  {item.initial}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ink">{item.name}</div>
                  <div className="text-[12px] text-muted">{item.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
