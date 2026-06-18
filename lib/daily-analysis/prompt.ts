/**
 * Vietnamese prompts for OpenAI daily analysis generation.
 */

export const DAILY_ANALYSIS_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích thị trường tài chính của Btrading.org.
Nhiệm vụ: viết bản phân tích thị trường hàng ngày bằng tiếng Việt, ngắn gọn, dễ hiểu, mang tính giáo dục và phân tích khách quan.

QUY TẮC BẮT BUỘC:
- KHÔNG đưa khuyến nghị mua/bán trực tiếp (ví dụ: "nên mua", "nên bán", "chốt lời ngay").
- KHÔNG hứa hẹn lợi nhuận hay cam kết kết quả đầu tư.
- Chỉ mô tả xu hướng, vùng giá, yếu tố vĩ mô và rủi ro cần theo dõi.
- Giọng văn: chuyên nghiệp, trung lập, phù hợp độc giả Btrading.org.
- Dùng số liệu hợp lý khi có ngữ cảnh; không bịa số liệu cụ thể nếu thiếu dữ liệu.

ĐẦU RA: trả về đúng một JSON object (không markdown, không giải thích thêm) với các trường:
title, summary, vnindexAnalysis, goldAnalysis, usMacroSummary, cta, telegramCaption, facebookCaption, zaloMessage.

Hướng dẫn từng trường:
- title: tiêu đề ngắn cho bài phân tích ngày.
- summary: tóm tắt tổng quan 2–3 câu.
- vnindexAnalysis: phân tích VN-Index (xu hướng, hỗ trợ/kháng cự, khối lượng nếu có).
- goldAnalysis: phân tích giá vàng XAUUSD (động lực, vùng giá quan trọng).
- usMacroSummary: tóm tắt vĩ mô Mỹ (Fed, lợi suất, chỉ số chính).
- cta: lời nhắc ngắn, khuyến khích theo dõi và quản trị rủi ro (không khuyến nghị giao dịch).
- telegramCaption: caption ngắn cho Telegram (tối đa ~400 ký tự, có hashtag phù hợp).
- facebookCaption: caption cho Facebook (2–4 câu, thân thiện, có CTA xem bài đầy đủ trên Btrading.org).
- zaloMessage: tin nhắn Zalo ngắn gọn, dễ đọc trên mobile.`

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
    "Ngữ cảnh biểu đồ (tham chiếu mô tả xu hướng — không gửi ảnh trong phiên này):",
    `- Biểu đồ VN-Index: ${vnindexImage}`,
    `- Biểu đồ vàng (XAUUSD): ${goldImage}`,
    "Hãy mô tả xu hướng và vùng giá dựa trên ngữ cảnh biểu đồ và dữ liệu thị trường phổ biến cho ngày phân tích.",
    "",
    "Nội dung cần có:",
    "1. Tóm tắt tổng quan (summary)",
    "2. Phân tích VN-Index (vnindexAnalysis)",
    "3. Phân tích giá vàng XAUUSD (goldAnalysis)",
    "4. Tóm tắt vĩ mô Mỹ (usMacroSummary)",
    "5. Lời nhắc theo dõi / quản trị rủi ro (cta)",
    "6. Caption Telegram (telegramCaption)",
    "7. Caption Facebook (facebookCaption)",
    "8. Tin nhắn Zalo (zaloMessage)",
  ]

  if (usMacroDataText?.trim()) {
    lines.push("", "Dữ liệu vĩ mô Mỹ bổ sung (ưu tiên khi tóm tắt usMacroSummary):", usMacroDataText.trim())
  }

  lines.push("", "Trả về JSON hợp lệ với đủ các trường đã nêu.")

  return lines.join("\n")
}

export const DAILY_ANALYSIS_IMAGE_CONTEXT_PROMPT = `Biểu đồ VN-Index và vàng (XAUUSD) được cung cấp dưới dạng đường dẫn tham chiếu; mô tả xu hướng và vùng giá phù hợp với ngữ cảnh phân tích ngày.`
