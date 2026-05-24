import { prisma } from "@/lib/prisma"

// Fallback doctor data matching the demo exactly
const FALLBACK_DOCTORS = [
  {
    id: "fallback-doc-1",
    initial: "A",
    name: "BS. Nguyễn Văn An",
    specialty: "Chuyên khoa: Da liễu · 12 năm KN",
    description:
      "Chuyên gia điều trị mụn và các bệnh da liễu mãn tính. Từng tu nghiệp tại Singapore.",
  },
  {
    id: "fallback-doc-2",
    initial: "B",
    name: "BS. Trần Thị Bích",
    specialty: "Chuyên khoa: Thẩm mỹ da · 8 năm KN",
    description: "Bác sĩ hàng đầu về trẻ hóa da không xâm lấn. Chuyên gia laser và RF.",
  },
  {
    id: "fallback-doc-3",
    initial: "C",
    name: "BS. Lê Hoàng Cường",
    specialty: "Chuyên khoa: Da liễu · 15 năm KN",
    description: "Phó khoa Da liễu Bệnh viện Đại học Y Dược. Chuyên điều trị bệnh da mãn tính.",
  },
]

export async function DoctorsSection() {
  let doctors = FALLBACK_DOCTORS

  try {
    const dbDoctors = await prisma.doctorProfile.findMany({
      where: { isActive: true },
      include: { profile: true },
      take: 3,
    })
    const linkedDoctors = dbDoctors.filter(
      (doctor): doctor is typeof doctor & { profile: NonNullable<typeof doctor.profile> } =>
        Boolean(doctor.profile),
    )
    if (linkedDoctors.length > 0) {
      doctors = linkedDoctors.map((doctor, i) => ({
        id: doctor.id,
        initial: doctor.profile.fullName.charAt(0).toUpperCase(),
        name: `BS. ${doctor.profile.fullName}`,
        specialty: `${doctor.specialty}`,
        description:
          FALLBACK_DOCTORS[i]?.description ||
          "Bác sĩ chuyên khoa da liễu với nhiều năm kinh nghiệm.",
      }))
    }
  } catch {
    // Use fallback data
  }

  return (
    <section id="doctors" className="py-20 px-[5%] bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[30px] font-[800] text-ink text-center tracking-[-0.5px] mb-2">
          Đội ngũ bác sĩ
        </h2>
        <p className="text-[15px] text-muted text-center mb-12 leading-[1.6]">
          Bác sĩ được đào tạo chuyên sâu, giàu kinh nghiệm trong lĩnh vực da liễu
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-surface-card rounded-2xl p-6 text-center transition-shadow duration-200 hover:shadow-elevated"
            >
              <div className="w-20 h-20 rounded-full bg-navy mx-auto mb-4 flex items-center justify-center text-[24px] font-bold text-white">
                {doctor.initial}
              </div>
              <div className="text-[16px] font-bold text-ink mb-1">{doctor.name}</div>
              <div className="text-[14px] text-muted">{doctor.specialty}</div>
              <hr className="my-4 border-none border-t border-hairline" />
              <div className="text-[14px] text-body leading-[1.6]">{doctor.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
