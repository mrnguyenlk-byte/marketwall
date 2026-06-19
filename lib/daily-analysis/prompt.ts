/**
 * Vietnamese prompts for OpenAI daily analysis generation.
 */

export const DAILY_ANALYSIS_DISCLAIMER =
  "Nội dung chỉ mang tính tham khảo, không phải khuyến nghị đầu tư."

export function appendDailyAnalysisDisclaimer(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return DAILY_ANALYSIS_DISCLAIMER
  if (trimmed.includes(DAILY_ANALYSIS_DISCLAIMER)) return trimmed
  return `${trimmed}\n\n${DAILY_ANALYSIS_DISCLAIMER}`
}

export const DAILY_ANALYSIS_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích thị trường tài chính của Btrading.org.
Nhiệm vụ: viết bản phân tích thị trường hàng ngày bằng tiếng Việt, ngắn gọn, chuyên nghiệp, mang tính giáo dục và phân tích khách quan.

QUY TẮC BẮT BUỘC:
1. KHÔNG dự đoán tương lai với mức độ chắc chắn (tránh "chắc chắn sẽ", "nhất định", "chắc sẽ tăng/giảm").
2. KHÔNG hứa hẹn lợi nhuận hay cam kết kết quả đầu tư.
3. KHÔNG dùng trực tiếp từ khuyến nghị giao dịch: mua, bán, long, short, chốt lời, cắt lỗ theo nghĩa khuyến nghị.
4. KHÔNG bịa số liệu VN-Index, giá vàng, hay dữ liệu vĩ mô — chỉ dùng số liệu được cung cấp trong prompt.
5. CHỈ sử dụng dữ liệu thị trường được cung cấp; nếu thiếu dữ liệu, ghi rõ "dữ liệu đang được cập nhật".
6. Tập trung: bối cảnh thị trường, phản ứng giá/chỉ số hiện tại, hỗ trợ/kháng cự nếu nhìn thấy trên biểu đồ, quản trị rủi ro, các kịch bản cần theo dõi (dùng ngôn ngữ có điều kiện: "nếu", "có thể", "cần theo dõi").
7. Giọng văn: tiếng Việt, ngắn gọn, chuyên nghiệp, phù hợp Btrading.org.

TUYÊN BỐ BẮT BUỘC — phải có nguyên văn ở cuối trường cta, telegramCaption và facebookCaption:
"${DAILY_ANALYSIS_DISCLAIMER}"

ĐẦU RA: trả về đúng một JSON object (không markdown, không giải thích thêm) với các trường:
title, summary, vnindexAnalysis, goldAnalysis, usMacroSummary, cta, telegramCaption, facebookCaption, zaloMessage.

Hướng dẫn từng trường:
- title: tiêu đề ngắn cho bài phân tích ngày.
- summary: tóm tắt tổng quan 2–3 câu (bối cảnh, không khuyến nghị giao dịch).
- vnindexAnalysis: phân tích VN-Index (bối cảnh, phản ứng giá/chỉ số, hỗ trợ/kháng cự nếu thấy trên biểu đồ, kịch bản theo dõi).
- goldAnalysis: phân tích giá vàng XAUUSD (bối cảnh, vùng giá quan trọng nếu có trong dữ liệu, rủi ro cần lưu ý).
- usMacroSummary: tóm tắt vĩ mô Mỹ từ dữ liệu cung cấp (Fed, lợi suất, chỉ số chính); thiếu dữ liệu thì nêu đang cập nhật.
- cta: lời nhắc ngắn về theo dõi thị trường và quản trị rủi ro; kết thúc bằng tuyên bố bắt buộc.
- telegramCaption: caption ngắn cho Telegram (tối đa ~400 ký tự, hashtag phù hợp); kết thúc bằng tuyên bố bắt buộc; không khuyến nghị mua/bán.
- facebookCaption: caption Facebook 2–4 câu, CTA xem bài trên Btrading.org; kết thúc bằng tuyên bố bắt buộc.
- zaloMessage: tin nhắn Zalo ngắn, dễ đọc trên mobile; trung lập, không khuyến nghị giao dịch.`

export type DailyAnalysisPromptInput = {
  date: string
  vnindexImage: string
  goldImage: string
  usMacroDataText?: string
}

export function buildDailyAnalysisUserPrompt(input: DailyAnalysisPromptInput): string {
  const { date, vnindexImage, goldImage, usMacroDataText } = input

  const lines = [
    `Viết bản phân tích thị trường ngày ${date} cho Btrading.org.`,
    "",
    "Dữ liệu được cung cấp (CHỈ dùng các thông tin dưới đây — không bịa thêm số liệu):",
    `- Biểu đồ VN-Index: ${vnindexImage}`,
    `- Biểu đồ vàng (XAUUSD): ${goldImage}`,
    "Mô tả xu hướng và vùng giá chỉ dựa trên ngữ cảnh biểu đồ và dữ liệu bổ sung (nếu có). Nếu không đủ số liệu cụ thể, ghi rõ dữ liệu đang được cập nhật.",
    "",
    "Nội dung cần có:",
    "1. Tóm tắt tổng quan (summary) — bối cảnh thị trường, không dự đoán chắc chắn",
    "2. Phân tích VN-Index (vnindexAnalysis) — phản ứng chỉ số, hỗ trợ/kháng cự nếu thấy, kịch bản theo dõi",
    "3. Phân tích giá vàng XAUUSD (goldAnalysis) — bối cảnh và rủi ro, không hứa lợi nhuận",
    "4. Tóm tắt vĩ mô Mỹ (usMacroSummary) — chỉ từ dữ liệu cung cấp",
    "5. Lời nhắc theo dõi / quản trị rủi ro (cta) — kèm tuyên bố bắt buộc",
    "6. Caption Telegram (telegramCaption) — kèm tuyên bố bắt buộc",
    "7. Caption Facebook (facebookCaption) — kèm tuyên bố bắt buộc",
    "8. Tin nhắn Zalo (zaloMessage)",
  ]

  if (usMacroDataText?.trim()) {
    lines.push("", "Dữ liệu vĩ mô Mỹ bổ sung (ưu tiên khi tóm tắt usMacroSummary):", usMacroDataText.trim())
  } else {
    lines.push("", "Không có dữ liệu vĩ mô Mỹ bổ sung — usMacroSummary nên nêu dữ liệu đang được cập nhật hoặc bối cảnh chung không kèm số liệu bịa.")
  }

  lines.push(
    "",
    `Nhắc lại tuyên bố bắt buộc cho cta, telegramCaption, facebookCaption: "${DAILY_ANALYSIS_DISCLAIMER}"`,
    "Trả về JSON hợp lệ với đủ các trường đã nêu.",
  )

  return lines.join("\n")
}

export const DAILY_ANALYSIS_IMAGE_CONTEXT_PROMPT = `Biểu đồ VN-Index và vàng (XAUUSD) được cung cấp dưới dạng đường dẫn tham chiếu; mô tả xu hướng và vùng giá chỉ khi có căn cứ từ ngữ cảnh biểu đồ, không bịa số liệu.`
