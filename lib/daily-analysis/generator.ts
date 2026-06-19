import {
  goldPromptSentence,
  MARKET_DATA_UPDATING_MESSAGE,
  vnindexPromptSentence,
  type DailyAnalysisMarketData,
} from "./market-data"
import { appendDailyAnalysisDisclaimer, buildDailyAnalysisCta } from "./prompt"
import { generateDailyAnalysisSlug } from "./slug"
import type { DailyAnalysis } from "./types"

function defaultVnindexImage(date: string): string {
  return `/uploads/daily-analysis/${date}/vnindex.png`
}

function defaultGoldImage(date: string): string {
  return `/uploads/daily-analysis/${date}/gold.png`
}

/** Phase 1 mock generator — no OpenAI calls. */
export function generateMockDailyAnalysis(
  date: string,
  vnindexImage?: string,
  goldImage?: string,
  marketData?: DailyAnalysisMarketData,
): DailyAnalysis {
  const now = new Date().toISOString()
  const title = `Phân tích thị trường ngày ${date}`
  const slug = generateDailyAnalysisSlug(title, date)
  const vnImage = vnindexImage ?? defaultVnindexImage(date)
  const gImage = goldImage ?? defaultGoldImage(date)

  const watchNext =
    "Theo dõi diễn biến tại các vùng giá quan trọng trên biểu đồ, lập kế hoạch quản trị rủi ro và chỉ điều chỉnh khi có tín hiệu xác nhận rõ ràng."
  const cta = buildDailyAnalysisCta(watchNext)
  const telegramCaption = appendDailyAnalysisDisclaimer(
    `📊 Phân tích ${date}: VN-Index, vàng XAUUSD và bối cảnh vĩ mô Mỹ. Xem chi tiết trên Btrading.org #Btrading #VNIndex #Vang`,
  )
  const facebookCaption = appendDailyAnalysisDisclaimer(
    `Phân tích thị trường ngày ${date} từ Btrading.org — bối cảnh VN-Index, vàng và vĩ mô Mỹ, nội dung tham khảo. Đọc đầy đủ tại Btrading.org.`,
  )

  const vnAnalysis = marketData
    ? marketData.vnindex.value != null
      ? `${vnindexPromptSentence(marketData.vnindex)} Theo biểu đồ, cần quan sát xu hướng ngắn hạn và các vùng hỗ trợ/kháng cự.`
      : MARKET_DATA_UPDATING_MESSAGE
    : "Theo biểu đồ VN-Index, cần quan sát xu hướng ngắn hạn và các vùng hỗ trợ/kháng cự nổi bật. Nếu chưa đủ căn cứ cụ thể, dữ liệu đang được cập nhật."
  const goldAnalysis = marketData
    ? marketData.gold.value != null
      ? `${goldPromptSentence(marketData.gold)} Cần đọc cùng bối cảnh USD và lợi suất.`
      : MARKET_DATA_UPDATING_MESSAGE
    : "Giá vàng XAUUSD cần đọc cùng bối cảnh USD và lợi suất. Các vùng giá quan trọng chỉ nêu khi nhìn thấy rõ trên biểu đồ."

  return {
    date,
    title,
    slug,
    summary:
      "Thị trường chứng khoán Việt Nam và vàng XAUUSD cần đọc trong bối cảnh vĩ mô toàn cầu. Nội dung dưới đây dựa trên biểu đồ được cung cấp, mang tính tham khảo.",
    vnindexAnalysis: vnAnalysis,
    goldAnalysis,
    usMacroSummary:
      "Dữ liệu vĩ mô Mỹ (Fed, lợi suất, chỉ số chính) đang được cập nhật. Nên theo dõi lịch công bố sắp tới để đánh giá kịch bản.",
    cta,
    telegramCaption,
    facebookCaption,
    zaloMessage: `Btrading — Phân tích ngày ${date}: VN-Index và vàng XAUUSD. Xem bài đầy đủ trên Btrading.org.`,
    vnindexImage: vnImage,
    goldImage: gImage,
    webUrl: `/daily-analysis/${slug}`,
    publishStatus: "draft",
    createdAt: now,
    updatedAt: now,
    ...(marketData ? { marketData } : {}),
  }
}
