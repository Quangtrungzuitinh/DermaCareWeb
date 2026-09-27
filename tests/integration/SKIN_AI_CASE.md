# HF-SKIN-001 — Kiểm tra kết nối Skin AI thực tế

| Mục | Nội dung |
| --- | --- |
| Mục tiêu | Kiểm tra hàm `querySkinDiseaseModel` gọi được model thật và trả dữ liệu hợp lệ |
| Model | `Jayanth2002/dinov2-base-finetuned-SkinDisease` |
| Điều kiện | Đã cài dependencies; có Internet và `HF_API_TOKEN` hợp lệ trong `.env.local` |
| Dữ liệu vào | JPEG 224 × 224 màu đồng nhất, được tạo trong bộ nhớ rồi chuyển sang base64 |
| Thao tác | Chạy `npm.cmd run test:skin-ai` |
| Kết quả mong đợi | Có ít nhất một dự đoán; nhãn không rỗng; điểm hữu hạn trong [0, 1] |
| Điều kiện thất bại | Thiếu token, lỗi HTTP/mạng, quá timeout của ứng dụng, kết quả rỗng hoặc sai cấu trúc |

Test gọi API Hugging Face thật, không mock phản hồi. Chỉ mock `server-only`
để chạy module Next.js trong môi trường test Node. Token được đọc từ biến môi trường,
không ghi trong mã nguồn hoặc in ra kết quả test.

Ảnh tổng hợp không có nhãn bệnh đúng để đối chiếu. Test xác minh kết nối và hợp đồng
dữ liệu, không đánh giá độ chính xác chẩn đoán, mức nặng hoặc tiến triển điều trị.
Test không truy cập database hay ảnh bệnh nhân và không nằm trong lệnh `npm test`
mặc định. Mỗi lần chạy có thể tiêu thụ quota inference.

## Kết quả chạy ngày 27/09/2026

PASS — 1/1 test, thời gian gọi và kiểm tra khoảng 6,10 giây.
Đã chạy với quyền truy cập mạng; không thay đổi timeout 10 giây của hàm ứng dụng.
