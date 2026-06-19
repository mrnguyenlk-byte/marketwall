/**
 * Vietnamese prompts for OpenAI daily analysis generation.
 */

export const DAILY_ANALYSIS_DISCLAIMER =
  "Nội dung chỉ mang tính tham khảo, không phải khuyến nghị đầu tư."

/** Max words across vnindexAnalysis + goldAnalysis + usMacroSummary + watchNext. */
export const DAILY_ANALYSIS_BODY_WORD_LIMIT = 180

export function appendDailyAnalysisDisclaimer(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return DAILY_ANALYSIS_DISCLAIMER
  if (trimmed.includes(DAILY_ANALYSIS_DISCLAIMER)) return trimmed
  return `${trimmed}\n\n${DAILY_ANALYSIS_DISCLAIMER}`
}

/** Section 4 (watchNext) + section 5 (disclaimer) for persisted `cta`. */
export function buildDailyAnalysisCta(watchNext: string): string {
  return appendDailyAnalysisDisclaimer(watchNext.trim())
}

export function countDailyAnalysisWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function countDailyAnalysisBodyWords(
  content: Pick<
    DailyAnalysisOpenAiContentShape,
    "vnindexAnalysis" | "goldAnalysis" | "usMacroSummary" | "watchNext"
  >,
): number {
  return (
    countDailyAnalysisWords(content.vnindexAnalysis) +
    countDailyAnalysisWords(content.goldAnalysis) +
    countDailyAnalysisWords(content.usMacroSummary) +
    countDailyAnalysisWords(content.watchNext)
  )
}

type DailyAnalysisOpenAiContentShape = {
  vnindexAnalysis: string
  goldAnalysis: string
  usMacroSummary: string
  watchNext: string
}

export const DAILY_ANALYSIS_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích thị trường tài chính của Btrading.org.
Nhiệm vụ: viết bản phân tích thị trường hàng ngày bằng tiếng Việt, ngắn gọn, chuyên nghiệp, trung lập và mang tính giáo dục.

QUY TẮC DỮ LIỆU — BẮT BUỘC:
1. KHÔNG bịa số liệu VN-Index — chỉ mô tả xu hướng/vùng giá khi có căn cứ từ biểu đồ được cung cấp.
2. KHÔNG bịa giá vàng (XAUUSD) — chỉ dùng thông tin từ biểu đồ vàng được cung cấp.
3. KHÔNG bịa dữ liệu kinh tế (CPI, Fed, lợi suất, GDP, v.v.) — chỉ dùng dữ liệu vĩ mô Mỹ và sự kiện lịch kinh tế được cung cấp trong prompt.
4. CHỈ sử dụng dữ liệu được cung cấp; thiếu dữ liệu thì ghi rõ "dữ liệu đang được cập nhật".
5. Biểu đồ chỉ là tham chiếu trực quan — không suy diễn số liệu cụ thể nếu không thấy rõ trên biểu đồ.

QUY TẮC NỘI DUNG:
1. KHÔNG dự đoán tương lai với mức độ chắc chắn (tránh "chắc chắn sẽ", "nhất định").
2. KHÔNG hứa hẹn lợi nhuận hay cam kết kết quả đầu tư.
3. KHÔNG dùng khuyến nghị giao dịch trực tiếp: mua, bán, long, short, chốt lời, cắt lỗ.
4. Dùng ngôn ngữ có điều kiện: "nếu", "có thể", "cần theo dõi".
5. Giọng văn: tiếng Việt, chuyên nghiệp, trung lập, giáo dục.

GIỚI HẠN ĐỘ DÀI:
- Tổng vnindexAnalysis + goldAnalysis + usMacroSummary + watchNext: TỐI ĐA ${DAILY_ANALYSIS_BODY_WORD_LIMIT} từ (cả bốn trường cộng lại).
- summary: 2–3 câu ngắn, không tính vào giới hạn 180 từ.
- telegramCaption: tối đa ~350 ký tự; facebookCaption: 2–3 câu ngắn; zaloMessage: 1–2 câu.

CẤU TRÚC NỘI DUNG (theo thứ tự):
1. VN-Index (vnindexAnalysis)
2. Vàng XAUUSD (goldAnalysis)
3. Kinh tế Mỹ (usMacroSummary)
4. Theo dõi tiếp theo (watchNext) — kịch bản/vùng cần quan sát, quản trị rủi ro
5. Tuyên bố pháp lý — KHÔNG ghi trong watchNext; hệ thống tự thêm disclaimer khi xuất bản

TUYÊN BỐ BẮT BUỘC — phải có nguyên văn ở cuối telegramCaption và facebookCaption:
"${DAILY_ANALYSIS_DISCLAIMER}"

ĐẦU RA: trả về đúng một JSON object (không markdown, không giải thích thêm) với các trường:
title, summary, vnindexAnalysis, goldAnalysis, usMacroSummary, watchNext, telegramCaption, facebookCaption, zaloMessage.

Hướng dẫn từng trường:
- title: tiêu đề ngắn cho bài phân tích ngày.
- summary: tóm tắt tổng quan 2–3 câu (bối cảnh, không khuyến nghị giao dịch).
- vnindexAnalysis: mục 1 — phân tích VN-Index từ biểu đồ được cung cấp.
- goldAnalysis: mục 2 — phân tích vàng XAUUSD từ biểu đồ được cung cấp.
- usMacroSummary: mục 3 — kinh tế Mỹ chỉ từ dữ liệu/sự kiện được cung cấp.
- watchNext: mục 4 — điểm cần theo dõi tiếp theo, kịch bản có điều kiện, quản trị rủi ro (không disclaimer).
- telegramCaption: caption Telegram ngắn, trung lập; kết thúc bằng tuyên bố bắt buộc.
- facebookCaption: caption Facebook 2–3 câu, trung lập, CTA xem bài trên Btrading.org; kết thúc bằng tuyên bố bắt buộc.
- zaloMessage: tin nhắn Zalo ngắn, trung lập, không khuyến nghị giao dịch.`

export type DailyAnalysisPromptInput = {
  date: string
  vnindexImage: string
  goldImage: string
  usMacroDataText?: string
  /** Recent US economic calendar events (when integrated upstream). */
  usEventsText?: string
  /** True when the US economic calendar was queried but returned no matching events. */
  usEventsCalendarChecked?: boolean
}

export function buildDailyAnalysisUserPrompt(input: DailyAnalysisPromptInput): string {
  const { date, vnindexImage, goldImage, usMacroDataText, usEventsText, usEventsCalendarChecked } =
    input

  const lines = [
    `Viết bản phân tích thị trường ngày ${date} cho Btrading.org.`,
    "",
    "Dữ liệu được cung cấp (CHỈ dùng các thông tin dưới đây — KHÔNG bịa số liệu VN-Index, giá vàng hay dữ liệu kinh tế):",
    `- Biểu đồ VN-Index (tham chiếu trực quan): ${vnindexImage}`,
    `- Biểu đồ vàng XAUUSD (tham chiếu trực quan): ${goldImage}`,
    "Mô tả xu hướng và vùng giá chỉ khi nhìn thấy rõ trên biểu đồ. Nếu không đủ căn cứ, ghi rõ dữ liệu đang được cập nhật.",
    "",
    "Cấu trúc nội dung bài phân tích (tối đa 180 từ cho 4 mục vnindexAnalysis + goldAnalysis + usMacroSummary + watchNext):",
    "1. VN-Index → vnindexAnalysis",
    "2. Vàng XAUUSD → goldAnalysis",
    "3. Kinh tế Mỹ → usMacroSummary",
    "4. Theo dõi tiếp theo → watchNext",
    "5. Disclaimer — hệ thống tự thêm; KHÔNG ghi trong watchNext",
    "",
    "Trường bổ sung:",
    "- summary: tóm tắt 2–3 câu",
    "- telegramCaption, facebookCaption: ngắn, trung lập, kèm tuyên bố bắt buộc",
    "- zaloMessage: tin nhắn Zalo ngắn",
  ]

  if (usMacroDataText?.trim()) {
    lines.push("", "Dữ liệu vĩ mô Mỹ (ưu tiên cho usMacroSummary):", usMacroDataText.trim())
  }

  if (usEventsText?.trim()) {
    lines.push(
      "",
      "Sự kiện kinh tế Mỹ gần đây (ưu tiên cho usMacroSummary và watchNext — KHÔNG bịa thêm sự kiện):",
      usEventsText.trim(),
    )
  }

  if (!usMacroDataText?.trim() && !usEventsText?.trim()) {
    if (usEventsCalendarChecked) {
      lines.push(
        "",
        "Không có sự kiện vĩ mô Mỹ quan trọng trong 24 giờ qua — usMacroSummary nên nêu dữ liệu đang được cập nhật hoặc bối cảnh chung, không kèm số liệu bịa.",
      )
    } else {
      lines.push(
        "",
        "Không có dữ liệu vĩ mô Mỹ hoặc sự kiện lịch kinh tế bổ sung — usMacroSummary nên nêu dữ liệu đang được cập nhật, không kèm số liệu bịa.",
      )
    }
  }

  lines.push(
    "",
    `Giới hạn: vnindexAnalysis + goldAnalysis + usMacroSummary + watchNext ≤ ${DAILY_ANALYSIS_BODY_WORD_LIMIT} từ.`,
    `Tuyên bố bắt buộc cho telegramCaption và facebookCaption: "${DAILY_ANALYSIS_DISCLAIMER}"`,
    "Trả về JSON hợp lệ với đủ các trường đã nêu.",
  )

  return lines.join("\n")
}

export const DAILY_ANALYSIS_IMAGE_CONTEXT_PROMPT = `Biểu đồ VN-Index và vàng (XAUUSD) được cung cấp dưới dạng đường dẫn tham chiếu; mô tả xu hướng và vùng giá chỉ khi có căn cứ từ ngữ cảnh biểu đồ, không bịa số liệu.`
