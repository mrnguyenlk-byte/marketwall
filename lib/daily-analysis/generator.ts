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

  return {
    date,
    title,
    slug,
    summary:
      "Thị trường chứng khoán Việt Nam điều chỉnh nhẹ trong phiên giao dịch hôm nay, trong khi giá vàng duy trì xu hướng tăng trung hạn. Vĩ mô Mỹ tiếp tục là yếu tố then chốt ảnh hưởng tới dòng tiền toàn cầu và tâm lý nhà đầu tư trong nước.",
    vnindexAnalysis:
      "VN-Index đóng cửa quanh vùng 1.280 điểm, giảm khoảng 0,4% so với phiên trước. Nhóm ngân hàng và bất động sản chịu áp lực bán chủ động, trong khi dòng tiền vẫn ưu tiên các mã midcap có kết quả kinh doanh quý 2 khả quan. Kháng cự ngắn hạn nằm tại 1.295–1.300 điểm; hỗ trợ quan trọng tại 1.265–1.270 điểm. Khối lượng giao dịch trên HOSE ở mức trung bình, cho thấy nhà đầu tư đang thận trọng chờ tín hiệu xác nhận xu hướng.",
    goldAnalysis:
      "Giá vàng (XAUUSD) giao dịch quanh 2.340–2.350 USD/oz, duy trì xu hướng tăng nhẹ trong ngắn hạn nhờ kỳ vọng Fed giữ lãi suất ổn định và nhu cầu trú ẩn an toàn. Vùng kháng cự gần 2.380 USD/oz; hỗ trợ tại 2.300–2.310 USD/oz. Biến động USD Index và lợi suất trái phiếu Mỹ 10 năm vẫn là hai yếu tố cần theo dõi sát trong các phiên tới.",
    usMacroSummary:
      "Thị trường Mỹ ghi nhận chỉ số CPI tháng gần nhất tăng chậm hơn kỳ vọng, củng cố kịch bản Fed có thể giữ nguyên lãi suất trong cuộc họp tới. Dow Jones và S&P 500 đóng cửa đi ngang; lợi suất trái phiếu 10 năm dao động quanh 4,2%. Dữ liệu việc làm và bán lẻ tuần tới có thể định hình lại kỳ vọng thị trường.",
    cta: "Nhà đầu tư nên ưu tiên quản trị rủi ro, theo dõi vùng hỗ trợ VN-Index và chỉ gia tăng vị thế khi có tín hiệu xác nhận từ khối lượng. Với vàng, có thể chia nhỏ vị thế và chờ điều chỉnh về vùng hỗ trợ trước khi bổ sung.",
    vnindexImage: vnImage,
    goldImage: gImage,
    webUrl: `/daily-analysis/${slug}`,
    publishStatus: "draft",
    createdAt: now,
    updatedAt: now,
  }
}
