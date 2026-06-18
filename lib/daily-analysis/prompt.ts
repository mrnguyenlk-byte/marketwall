/**
 * Placeholder prompt templates for future OpenAI integration.
 * No API calls are made in Phase 1.
 */

export const DAILY_ANALYSIS_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích thị trường tài chính của Btrading.
Nhiệm vụ: viết bản phân tích thị trường hàng ngày bằng tiếng Việt, ngắn gọn, dễ hiểu, có số liệu cụ thể.
Cấu trúc: tóm tắt chung, phân tích VN-Index, phân tích vàng (XAUUSD), tóm tắt vĩ mô Mỹ, và lời kêu gọi hành động (CTA).
Giọng văn: chuyên nghiệp, khách quan, không đưa lời khuyên đầu tư cá nhân hóa.`

export function buildDailyAnalysisUserPrompt(date: string): string {
  return `Viết bản phân tích thị trường ngày ${date}.
Bao gồm:
1. Tóm tắt tổng quan (2-3 câu)
2. Phân tích VN-Index (xu hướng, hỗ trợ/kháng cự, khối lượng)
3. Phân tích giá vàng XAUUSD (động lực, vùng giá quan trọng)
4. Tóm tắt vĩ mô Mỹ (Fed, lợi suất, chỉ số chính)
5. CTA ngắn gọn cho nhà đầu tư theo dõi

Trả về JSON với các trường: summary, vnindexAnalysis, goldAnalysis, usMacroSummary, cta, title.`
}

export const DAILY_ANALYSIS_IMAGE_CONTEXT_PROMPT = `Sử dụng biểu đồ đính kèm (VN-Index và vàng) làm tham chiếu trực quan khi mô tả xu hướng và vùng giá.`
