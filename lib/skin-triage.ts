import "server-only"

export type TriageLevel = "RED" | "YELLOW" | "GREEN"
export type DoctorForTriage = {
  name: string
  specialties: string[]
  tags: string[]
  is_telehealth_active: boolean
}

type Rule = {
  en: string
  vi: string
  level: TriageLevel
  specialties: string[]
  telehealth: boolean
}

const R = (en: string, vi: string, level: TriageLevel, specialties: string[], telehealth: boolean): Rule => ({ en, vi, level, specialties, telehealth })

export const SKIN_TRIAGE_RULES: Record<string, Rule> = {
  "0": R("Basal Cell Carcinoma", "Ung thư biểu mô tế bào đáy", "RED", ["Surgical Dermatology", "Oncologic Dermatology"], false),
  "12": R("Melanoma", "U hắc tố", "RED", ["Surgical Dermatology", "Oncologic Dermatology"], false),
  "14": R("Mycosis Fungoides", "U sùi dạng nấm", "RED", ["Surgical Dermatology", "Oncologic Dermatology"], false),
  "29": R("squamous cell carcinoma", "Ung thư biểu mô tế bào vảy", "RED", ["Surgical Dermatology", "Oncologic Dermatology"], false),
  "1": R("Darier_s Disease", "Bệnh Darier", "YELLOW", ["Medical Dermatology", "Genetic Dermatology"], true),
  "2": R("Epidermolysis Bullosa Pruriginosa", "Ly thượng bì bóng nước ngứa", "YELLOW", ["Medical Dermatology", "Genetic Dermatology"], true),
  "3": R("Hailey-Hailey Disease", "Bệnh Hailey-Hailey", "YELLOW", ["Medical Dermatology", "Genetic Dermatology"], true),
  "11": R("Lupus Erythematosus Chronicus Discoides", "Lupus ban dạng đĩa", "YELLOW", ["Medical Dermatology", "Immunodermatology"], true),
  "7": R("Leprosy Borderline", "Phong thể trung gian", "YELLOW", ["Medical Dermatology", "Infectious Disease"], false),
  "8": R("Leprosy Lepromatous", "Phong thể u", "YELLOW", ["Medical Dermatology", "Infectious Disease"], false),
  "9": R("Leprosy Tuberculoid", "Phong thể củ", "YELLOW", ["Medical Dermatology", "Infectious Disease"], false),
  "15": R("Neurofibromatosis", "U xơ thần kinh", "YELLOW", ["Pediatric Dermatology", "Genetic Dermatology", "Academic Dermatology"], true),
  "24": R("actinic keratosis", "Dày sừng ánh sáng", "YELLOW", ["Cosmetic Dermatology", "Surgical Dermatology"], true),
  "5": R("Impetigo", "Chốc lở", "GREEN", ["Medical Dermatology", "Pediatric Dermatology"], true),
  "13": R("Molluscum Contagiosum", "U mềm lây", "GREEN", ["Medical Dermatology", "Pediatric Dermatology"], true),
  "17": R("Pediculosis Capitis", "Chấy da đầu", "GREEN", ["Medical Dermatology", "Pediatric Dermatology"], true),
  "4": R("Herpes Simplex", "Herpes môi/sinh dục", "GREEN", ["Medical Dermatology", "General Dermatology"], true),
  "10": R("Lichen Planus", "Lichen phẳng", "GREEN", ["Medical Dermatology", "General Dermatology"], true),
  "18": R("Pityriasis Rosea", "Vảy phấn hồng", "GREEN", ["Medical Dermatology", "General Dermatology"], true),
  "21": R("Tinea Corporis", "Nấm da thân", "GREEN", ["Medical Dermatology", "General Dermatology"], true),
  "22": R("Tinea Nigra", "Nấm lang ben đen", "GREEN", ["Medical Dermatology", "General Dermatology"], true),
  "6": R("Larva Migrans", "Ấu trùng di chuyển dưới da", "GREEN", ["Medical Dermatology", "Parasitology"], true),
  "23": R("Tungiasis", "Bọ chét cát ký sinh", "GREEN", ["Medical Dermatology", "Parasitology"], true),
  "16": R("Papilomatosis Confluentes And Reticulate", "Bệnh sẩn dạng lưới liên kết", "GREEN", ["Medical Dermatology", "Cosmetic Dermatology"], true),
  "19": R("Porokeratosis Actinic", "Dày sừng dạng rãnh do ánh sáng", "GREEN", ["Medical Dermatology", "Cosmetic Dermatology"], true),
  "20": R("Psoriasis", "Bệnh vảy nến", "GREEN", ["Medical Dermatology", "General Dermatology"], true),
  "25": R("dermatofibroma", "U xơ da", "GREEN", ["General Dermatology", "Surgical/Cosmetic Dermatology"], true),
  "26": R("nevus", "Nốt ruồi", "GREEN", ["General Dermatology", "Surgical/Cosmetic Dermatology"], true),
  "27": R("pigmented benign keratosis", "Dày sừng sắc tố lành tính", "GREEN", ["Cosmetic Dermatology"], true),
  "28": R("seborrheic keratosis", "Dày sừng tiết bã", "GREEN", ["Cosmetic Dermatology"], true),
  "30": R("vascular lesion", "Tổn thương mạch máu", "GREEN", ["Cosmetic Dermatology", "Pediatric Dermatology"], true),
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, " ").trim()
}

function disclaimer(rule: Rule) {
  if (rule.level === "RED") return `🚨 CẢNH BÁO SỨC KHỎE QUAN TRỌNG: Kết quả AI phát hiện dấu hiệu liên quan đến ${rule.vi}. Hệ thống đã VÔ HIỆU HÓA khám trực tuyến (Telehealth). Bạn cần đi khám TRỰC TIẾP ngay tại các bệnh viện có chuyên khoa Phẫu thuật / Ung thư Da liễu.`
  if (rule.level === "YELLOW") return `🟡 LƯU Ý LÂM SÀNG: AI nhận diện tổn thương da có thể thuộc nhóm bệnh lý ${rule.vi}. Bạn nên hẹn gặp các chuyên gia thuộc chuyên khoa ${rule.specialties.join(", ")} tại các bệnh viện lớn để quản lý bệnh.`
  return `🟢 KẾT QUẢ PHÂN TÍCH: AI dự đoán làn da gặp tình trạng ${rule.vi} (lành tính/phổ biến). Bạn có thể đăng ký Tư vấn từ xa (Telehealth) với bác sĩ chuyên khoa ${rule.specialties.join(", ")}.`
}

export function triageSkinAnalysis(input: {
  ai_predictions: Record<string, number>
  user_meta: { age?: number | null }
  doctors_db: DoctorForTriage[]
}) {
  const entries = Object.entries(input.ai_predictions).filter(([code, probability]) =>
    SKIN_TRIAGE_RULES[code] && Number.isFinite(probability) && probability >= 0 && probability <= 1,
  )
  if (!entries.length) throw new Error("NO_VALID_SKIN_PREDICTION")
  const red = entries.filter(([code, probability]) => SKIN_TRIAGE_RULES[code]?.level === "RED" && probability >= 0.1).sort((a, b) => b[1] - a[1])[0]
  const active = red ?? entries.sort((a, b) => b[1] - a[1])[0]
  if (!active) throw new Error("NO_VALID_SKIN_PREDICTION")
  const rule = SKIN_TRIAGE_RULES[active[0]]
  if (!rule) throw new Error("UNKNOWN_SKIN_PREDICTION")
  const specialties = input.user_meta.age != null && input.user_meta.age < 16
    ? ["Pediatric Dermatology", ...rule.specialties.filter((item) => item !== "Pediatric Dermatology")]
    : rule.specialties
  const doctorRows = input.doctors_db.map((doctor) => {
    const search = [...doctor.tags, ...doctor.specialties].map(normalize)
    const conditionMatch = search.includes(normalize(rule.en)) || search.includes(normalize(rule.vi)) ? 10 : 0
    const specialtyMatches = specialties.filter((specialty) => search.includes(normalize(specialty))).length
    return {
      name: doctor.name,
      specialties: doctor.specialties,
      match_score: conditionMatch + specialtyMatches * 5,
      can_consult_online: rule.telehealth && doctor.is_telehealth_active,
    }
  }).filter((doctor) => doctor.match_score > 0).sort((a, b) => b.match_score - a.match_score).slice(0, 3)
  return {
    ai_analysis: { detected_condition_vi: rule.vi, triage_urgency: rule.level, telehealth_allowed: rule.telehealth },
    alert_message: disclaimer({ ...rule, specialties }),
    recommended_doctors: doctorRows,
  }
}
