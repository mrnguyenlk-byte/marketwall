"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"

export type Lang = "vi" | "en"

type Dict = Record<string, { vi: string; en: string }>

// Central dictionary. Each key maps to a Vietnamese + English string.
const dict: Dict = {
  // Nav
  "nav.dashboard": { vi: "Tổng quan", en: "Dashboard" },
  "nav.markets": { vi: "Thị trường", en: "Markets" },
  "nav.heatmaps": { vi: "Bản đồ nhiệt", en: "Heatmaps" },
  "nav.events": { vi: "Sự kiện", en: "Events" },
  "nav.news": { vi: "Tin tức", en: "News" },
  "nav.watchlist": { vi: "Danh mục", en: "Watchlist" },
  "nav.brokers": { vi: "Nhà môi giới", en: "Brokers" },

  // Header actions
  "action.search": { vi: "Tìm kiếm thị trường, mã...", en: "Search markets, symbols..." },
  "action.searchFull": { vi: "Tìm kiếm thị trường, mã, tin tức...", en: "Search markets, symbols, news..." },
  "action.theme": { vi: "Giao diện", en: "Theme" },
  "action.login": { vi: "Đăng nhập", en: "Login" },
  "action.register": { vi: "Đăng ký", en: "Register" },
  "action.notifications": { vi: "Thông báo", en: "Notifications" },
  "action.viewAll": { vi: "Xem tất cả", en: "View all" },
  "action.viewFullHeatmap": { vi: "Xem bản đồ nhiệt đầy đủ", en: "View full heatmap" },
  "action.language": { vi: "Ngôn ngữ", en: "Language" },

  // Section titles
  "sec.overview": { vi: "Tổng quan thị trường", en: "Market Overview" },
  "sec.currencies": { vi: "Hiệu suất tiền tệ chính", en: "Major Currency Performance" },
  "sec.currencyStrength": { vi: "Sức mạnh tiền tệ", en: "Currency Strength" },
  "sec.currencyStrength1D": { vi: "Sức mạnh tiền tệ (1D)", en: "Currency Strength (1D)" },
  "sec.calendar": { vi: "Lịch kinh tế toàn cầu", en: "Global Economic Calendar" },
  "sec.news": { vi: "Tin nóng", en: "Breaking News" },
  "sec.usHeatmap": { vi: "Bản đồ nhiệt thị trường Mỹ", en: "US Market Heatmap" },
  "sec.vnHeatmap": { vi: "Bản đồ nhiệt thị trường Việt Nam", en: "Vietnam Market Heatmap" },
  "sec.cryptoHeatmap": { vi: "Bản đồ nhiệt tiền mã hóa", en: "Crypto Heatmap" },
  "sec.fearGreed": { vi: "Chỉ số Sợ hãi & Tham lam", en: "Fear & Greed Index" },
  "sec.breadth": { vi: "Độ rộng thị trường", en: "Market Breadth" },
  "sec.topMovers": { vi: "Biến động mạnh nhất", en: "Top Movers" },
  "sec.watchlist": { vi: "Danh mục theo dõi", en: "Watchlist Preview" },
  "sec.brokers": { vi: "Nhà môi giới hàng đầu", en: "Top Rated Brokers" },
  "sec.heatmaps": { vi: "Bản đồ nhiệt thị trường", en: "Market Heatmaps" },

  // Generic labels
  "label.gainers": { vi: "Tăng giá", en: "Gainers" },
  "label.losers": { vi: "Giảm giá", en: "Losers" },
  "label.symbol": { vi: "Mã", en: "Symbol" },
  "label.last": { vi: "Giá", en: "Last" },
  "label.change": { vi: "Thay đổi", en: "Change" },
  "label.changePct": { vi: "% Thay đổi", en: "% Chg" },
  "label.volume": { vi: "Khối lượng", en: "Volume" },
  "label.high": { vi: "Cao", en: "High" },
  "label.low": { vi: "Thấp", en: "Low" },
  "label.time": { vi: "Thời gian", en: "Time" },
  "label.event": { vi: "Sự kiện", en: "Event" },
  "label.actual": { vi: "Thực tế", en: "Actual" },
  "label.forecast": { vi: "Dự báo", en: "Forecast" },
  "label.previous": { vi: "Trước đó", en: "Previous" },
  "label.impact": { vi: "Tác động", en: "Impact" },
  "label.advancing": { vi: "Tăng", en: "Advancing" },
  "label.declining": { vi: "Giảm", en: "Declining" },
  "label.unchanged": { vi: "Không đổi", en: "Unchanged" },
  "label.newHighs": { vi: "Đỉnh mới", en: "New Highs" },
  "label.newLows": { vi: "Đáy mới", en: "New Lows" },
  "label.aboveMa": { vi: "Trên MA50", en: "Above MA50" },
  "label.marketCap": { vi: "Vốn hóa", en: "Market Cap" },
  "label.weighted": { vi: "Theo vốn hóa", en: "Cap weighted" },
  "label.updated": { vi: "Cập nhật", en: "Updated" },
  "label.rating": { vi: "Đánh giá", en: "Rating" },
  "label.minDeposit": { vi: "Nạp tối thiểu", en: "Min. deposit" },
  "label.assets": { vi: "Loại tài sản", en: "Asset classes" },
  "label.license": { vi: "Giấy phép", en: "License" },
  "label.spreadFrom": { vi: "Spread từ", en: "Spread from" },
  "label.platforms": { vi: "Nền tảng", en: "Platforms" },

  // Impact
  "impact.high": { vi: "Cao", en: "High" },
  "impact.medium": { vi: "Trung bình", en: "Medium" },
  "impact.low": { vi: "Thấp", en: "Low" },

  // Fear & greed states
  "fg.extremeFear": { vi: "Sợ hãi tột độ", en: "Extreme Fear" },
  "fg.fear": { vi: "Sợ hãi", en: "Fear" },
  "fg.neutral": { vi: "Trung lập", en: "Neutral" },
  "fg.greed": { vi: "Tham lam", en: "Greed" },
  "fg.extremeGreed": { vi: "Tham lam tột độ", en: "Extreme Greed" },
  "fg.vnindex": { vi: "Thị trường VN", en: "VN Market" },
  "fg.crypto": { vi: "Thị trường Crypto", en: "Crypto Market" },
  "fg.usStocks": { vi: "Cổ phiếu Mỹ", en: "US Stocks" },

  // Heatmap tabs
  "tab.usMarket": { vi: "Thị trường Mỹ", en: "US Market" },
  "tab.vnMarket": { vi: "Thị trường Việt Nam", en: "Vietnam Market" },
  "tab.cryptoMarket": { vi: "Thị trường Crypto", en: "Crypto Market" },
  "tab.hose": { vi: "HOSE", en: "HOSE" },
  "tab.hnx": { vi: "HNX", en: "HNX" },
  "tab.upcom": { vi: "UPCOM", en: "UPCOM" },
  "tab.derivatives": { vi: "Phái sinh", en: "Derivatives" },

  // Sidebar ads
  "ad.brokerPromo.title": {
    vi: "Giao dịch thông minh với nhà môi giới hàng đầu",
    en: "Trade Smarter With Top Brokers",
  },
  "ad.brokerPromo.subtitle": {
    vi: "So sánh, lựa chọn và giao dịch tự tin",
    en: "Compare, Choose, and Trade with Confidence",
  },
  "ad.brokerPromo.cta": { vi: "Xem nhà môi giới", en: "View Brokers" },
  "ad.proBroker.title": {
    vi: "Trở thành Nhà môi giới chuyên nghiệp",
    en: "Become a Professional Broker",
  },
  "ad.proBroker.b1": { vi: "Hoa hồng cao", en: "High commission" },
  "ad.proBroker.b2": { vi: "Hỗ trợ toàn diện", en: "Full support" },
  "ad.proBroker.b3": { vi: "Công nghệ tiên tiến", en: "Advanced technology" },
  "ad.proBroker.b4": { vi: "Phát triển bền vững", en: "Sustainable growth" },
  "ad.proBroker.cta": { vi: "Tìm hiểu ngay", en: "Learn More" },

  // Overview sidebar tabs
  "overview.indices": { vi: "Chỉ số", en: "Indices" },
  "overview.commodities": { vi: "Hàng hóa", en: "Commodities" },
  "overview.crypto": { vi: "Crypto", en: "Crypto" },
  "overview.forex": { vi: "Forex", en: "Forex" },

  // Currency strength ranks
  "strength.strongest": { vi: "Mạnh nhất", en: "Strongest" },
  "strength.veryStrong": { vi: "Rất mạnh", en: "Very Strong" },
  "strength.strong": { vi: "Mạnh", en: "Strong" },
  "strength.neutral": { vi: "Trung lập", en: "Neutral" },
  "strength.weak": { vi: "Yếu", en: "Weak" },
  "strength.weakest": { vi: "Yếu nhất", en: "Weakest" },

  // Footer
  "footer.about": { vi: "Về chúng tôi", en: "About Us" },
  "footer.contact": { vi: "Liên hệ", en: "Contact" },
  "footer.advertise": { vi: "Quảng cáo", en: "Advertise" },
  "footer.dataPartners": { vi: "Đối tác dữ liệu", en: "Data Partners" },
  "footer.risk": { vi: "Cảnh báo rủi ro", en: "Risk Disclosure" },
  "footer.terms": { vi: "Điều khoản & Điều kiện", en: "Terms & Conditions" },
  "footer.privacy": { vi: "Chính sách bảo mật", en: "Privacy Policy" },
  "footer.cookie": { vi: "Chính sách Cookie", en: "Cookie Policy" },
  "footer.disclaimer": { vi: "Tuyên bố miễn trừ", en: "Disclaimer" },
  "footer.company": { vi: "Công ty", en: "Company" },
  "footer.legal": { vi: "Pháp lý", en: "Legal" },
  "footer.tagline": {
    vi: "Dữ liệu thị trường toàn cầu, trực quan và dễ hiểu.",
    en: "Global market data, visualized and made simple.",
  },
  "footer.rights": {
    vi: "Mọi quyền được bảo lưu.",
    en: "All rights reserved.",
  },

  // Risk warning
  "risk.title": { vi: "Cảnh báo rủi ro", en: "Risk Warning" },
  "risk.body": {
    vi: "Mọi dữ liệu trên MarketWall chỉ mang tính chất thông tin và tham khảo. Các con số được hiển thị là dữ liệu mẫu minh họa, không phản ánh giá giao dịch thực tế. MarketWall không cung cấp khuyến nghị đầu tư, tín hiệu mua bán hay tư vấn tài chính. Giá tài sản tài chính có thể biến động mạnh và bạn có thể chịu tổn thất. Hãy tự nghiên cứu và cân nhắc kỹ trước khi đưa ra bất kỳ quyết định nào.",
    en: "All data on MarketWall is provided for informational and reference purposes only. The figures shown are illustrative sample data and do not reflect real-time prices. MarketWall does not provide investment advice, buy/sell signals, or financial recommendations. Prices of financial assets can be highly volatile and you may incur losses. Always do your own research before making any decision.",
  },
  "risk.disclaimer": {
    vi: "Tuyên bố miễn trừ trách nhiệm",
    en: "General Disclaimer",
  },
  "risk.disclaimerBody": {
    vi: "MarketWall và các bên cung cấp dữ liệu không chịu trách nhiệm cho bất kỳ tổn thất hoặc thiệt hại nào phát sinh từ việc sử dụng thông tin trên nền tảng này.",
    en: "MarketWall and its data providers will not accept any liability for loss or damage arising from reliance on the information contained within this platform.",
  },

  // Misc
  "misc.live": { vi: "Trực tiếp", en: "Live" },
  "misc.delayed": { vi: "Dữ liệu trễ", en: "Delayed data" },
  "misc.today": { vi: "Hôm nay", en: "Today" },
  "misc.indices": { vi: "Chỉ số", en: "Indices" },
  "misc.commodities": { vi: "Hàng hóa", en: "Commodities" },
  "misc.crypto": { vi: "Tiền mã hóa", en: "Crypto" },
  "misc.currencies": { vi: "Tiền tệ", en: "Currencies" },
  "misc.sentiment": { vi: "Tâm lý thị trường", en: "Market sentiment" },
  "misc.openBroker": { vi: "Xem chi tiết", en: "View details" },
  "misc.visitBroker": { vi: "Truy cập", en: "Visit Broker" },
  "misc.viewReview": { vi: "Xem đánh giá", en: "View Review" },
  "broker.disclaimer": {
    vi: "Thông tin nhà môi giới chỉ nhằm mục đích so sánh và không cấu thành lời khuyên tài chính.",
    en: "Broker information is for comparison purposes only and does not constitute financial advice.",
  },
}

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LangContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en")

  const t = useCallback(
    (key: string) => {
      const entry = dict[key]
      if (!entry) return key
      return entry[lang]
    },
    [lang],
  )

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error("useLang must be used within LanguageProvider")
  return ctx
}
