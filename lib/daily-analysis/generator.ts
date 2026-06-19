import { appendDailyAnalysisDisclaimer } from "./prompt"
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
): DailyAnalysis {
  const now = new Date().toISOString()
  const title = `Phân tích thị trường ngày ${date}`
  const slug = generateDailyAnalysisSlug(title, date)
  const vnImage = vnindexImage ?? defaultVnindexImage(date)
  const gImage = goldImage ?? defaultGoldImage(date)

  const cta = appendDailyAnalysisDisclaimer(
    "Theo dõi diễn biến tại các vùng giá quan trọng trên biểu đồ, lập kế hoạch quản trị rủi ro và chỉ điều chỉnh khi có tín hiệu xác nhận rõ ràng.",
  )
  const telegramCaption = appendDailyAnalysisDisclaimer(
    `📊 Phân tích thị trường ${date}: tổng quan VN-Index, vàng XAUUSD và bối cảnh vĩ mô. Xem chi tiết trên Btrading.org #Btrading #VNIndex #Vang`,
  )
  const facebookCaption = appendDailyAnalysisDisclaimer(
    `Bản phân tích thị trường ngày ${date} từ Btrading.org: bối cảnh VN-Index, vàng XAUUSD và vĩ mô Mỹ — nội dung giáo dục, giúp theo dõi xu hướng và quản trị rủi ro. Đọc đầy đủ tại Btrading.org.`,
  )

  return {
    date,
    title,
    slug,
    summary:
      "Thị trường chứng khoán Việt Nam ghi nhận biến động trong phiên gần nhất; cần đối chiếu biểu đồ VN-Index để nắm bối cảnh. Giá vàng XAUUSD phản ánh tâm lý risk-on/risk-off và yếu tố vĩ mô. Bối cảnh Mỹ (Fed, lợi suất) tiếp tục ảnh hưởng dòng tiền toàn cầu.",
    vnindexAnalysis:
      "Theo biểu đồ VN-Index, cần quan sát xu hướng ngắn hạn và các vùng hỗ trợ/kháng cự nổi bật trên đồ thị. Khối lượng và phân bổ dòng tiền ngành có thể là tín hiệu bổ sung — nếu dữ liệu chi tiết chưa có, dữ liệu đang được cập nhật.",
    goldAnalysis:
      "Giá vàng XAUUSD cần được đọc trong bối cảnh USD, lợi suất và nhu cầu trú ẩn an toàn. Các vùng giá quan trọng chỉ nên nêu khi nhìn thấy rõ trên biểu đồ; nếu thiếu số liệu cụ thể, dữ liệu đang được cập nhật.",
    usMacroSummary:
      "Tóm tắt vĩ mô Mỹ (Fed, lợi suất, chỉ số chính) dựa trên dữ liệu cập nhật. Nếu chưa có số liệu mới trong phiên, dữ liệu đang được cập nhật — nhà đầu tư nên theo dõi lịch công bố sắp tới để đánh giá kịch bản.",
    cta,
    telegramCaption,
    facebookCaption,
    zaloMessage: `Btrading — Phân tích ngày ${date}: tổng quan VN-Index và vàng XAUUSD trong bối cảnh vĩ mô. Xem bài đầy đủ trên Btrading.org.`,
    vnindexImage: vnImage,
    goldImage: gImage,
    webUrl: `/daily-analysis/${slug}`,
    publishStatus: "draft",
    createdAt: now,
    updatedAt: now,
  }
}
