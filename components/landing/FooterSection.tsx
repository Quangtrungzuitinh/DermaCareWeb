import Link from "next/link"

export function FooterSection() {
  const linkClass =
    "block text-[14px] text-white/70 no-underline transition-colors duration-150 hover:text-white"

  return (
    <footer className="bg-navy px-[5%] pb-8 pt-12 text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-[10px]">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3v4l3 3-3 3V17a7 7 0 1 1 0-12z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold text-white tracking-[-0.3px]">
              DermaCare Clinic
            </span>
          </div>
          <p className="text-[14px] mt-3 leading-[1.7] max-w-[240px] text-white/60">
            Phòng khám da liễu uy tín tại TP.HCM. Chuyên điều trị bệnh da, thẩm mỹ da và chăm sóc
            sức khỏe làn da.
          </p>
        </div>

        {/* Dịch vụ */}
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.8px] mb-4 text-white/50">
            Dịch vụ
          </h4>
          <div className="space-y-2">
            <Link href="#" className={linkClass}>
              Khám da tổng quát
            </Link>
            <Link href="#" className={linkClass}>
              Điều trị mụn
            </Link>
            <Link href="#" className={linkClass}>
              Trẻ hóa da
            </Link>
            <Link href="#" className={linkClass}>
              Laser
            </Link>
          </div>
        </div>

        {/* Thông tin */}
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.8px] mb-4 text-white/50">
            Thông tin
          </h4>
          <div className="space-y-2">
            <Link href="#" className={linkClass}>
              Về chúng tôi
            </Link>
            <Link href="#" className={linkClass}>
              Đội ngũ bác sĩ
            </Link>
            <Link href="#" className={linkClass}>
              Blog sức khỏe
            </Link>
            <Link href="#" className={linkClass}>
              Liên hệ
            </Link>
          </div>
        </div>

        {/* Hotline */}
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.8px] mb-4 text-white/50">
            Hotline
          </h4>
          <div className="space-y-2">
            <Link href="tel:02834567890" className={linkClass}>
              028 3456 7890
            </Link>
            <Link href="mailto:info@dermacare.vn" className={linkClass}>
              info@dermacare.vn
            </Link>
            <span className="block text-[14px] text-white/70">123 Nguyễn Thị Minh Khai, Q.1</span>
          </div>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/10">
        <p className="text-[13px] text-white/40">
          © 2026 DermaCare Clinic. Mọi quyền được bảo lưu.
        </p>
        <p className="text-[13px] text-white/40">Chính sách bảo mật · Điều khoản sử dụng</p>
      </div>
    </footer>
  )
}
