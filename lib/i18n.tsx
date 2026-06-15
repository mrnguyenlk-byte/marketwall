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
  "nav.brokers": { vi: "Nền tảng", en: "Platforms" },
  "nav.contact": { vi: "Liên hệ", en: "Contact" },

  // Header actions
  "action.search": { vi: "Tìm kiếm thị trường, mã...", en: "Search markets, symbols..." },
  "action.searchFull": { vi: "Tìm kiếm thị trường, mã, tin tức...", en: "Search markets, symbols, news..." },
  "action.theme": { vi: "Giao diện", en: "Theme" },
  "action.theme.light": { vi: "Chuyển sang giao diện sáng", en: "Switch to light mode" },
  "action.theme.dark": { vi: "Chuyển sang giao diện tối", en: "Switch to dark mode" },
  "action.theme.toggle": { vi: "Chuyển giao diện", en: "Toggle theme" },
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
  "sec.brokers": { vi: "So sánh nền tảng", en: "Platform Comparison" },
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
  "label.timezone": { vi: "UTC", en: "UTC" },
  "label.currency": { vi: "Tiền tệ", en: "Currency" },
  "label.strength": { vi: "Sức mạnh", en: "Strength" },
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
  "action.viewMore": { vi: "Xem thêm", en: "View more" },
  "fg.vnindex": { vi: "Thị trường Việt Nam", en: "Vietnam Market" },
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
    vi: "Giao dịch thông minh với Nền tảng hàng đầu",
    en: "Trade Smarter With Top Platforms",
  },
  "ad.brokerPromo.subtitle": {
    vi: "So sánh, lựa chọn và giao dịch tự tin",
    en: "Compare, Choose, and Trade with Confidence",
  },
  "ad.brokerPromo.cta": { vi: "Xem nền tảng", en: "View Platforms" },
  "ad.proBroker.title": {
    vi: "Trở thành Đối tác Nền tảng chuyên nghiệp",
    en: "Become A Professional Platform Partner",
  },
  "ad.proBroker.b1": { vi: "Hoa hồng cao", en: "High commission" },
  "ad.proBroker.b2": { vi: "Hỗ trợ toàn diện", en: "Full support" },
  "ad.proBroker.b3": { vi: "Công nghệ tiên tiến", en: "Advanced technology" },
  "ad.proBroker.b4": { vi: "Phát triển bền vững", en: "Sustainable growth" },
  "ad.proBroker.cta": { vi: "Tìm hiểu thêm", en: "Learn More" },

  // Contact page
  "sec.contact": { vi: "Liên hệ", en: "Contact" },
  "contact.tagline": {
    vi: "Liên hệ BTrading Market Insights về hợp tác, quảng cáo, dữ liệu thị trường và các câu hỏi chung.",
    en: "Contact BTrading Market Insights about partnerships, advertising, market data and general inquiries.",
  },
  "contact.formTitle": { vi: "Gửi tin nhắn", en: "Send a Message" },
  "contact.name": { vi: "Họ tên", en: "Full Name" },
  "contact.email": { vi: "Email", en: "Email" },
  "contact.phone": { vi: "Điện thoại", en: "Phone" },
  "contact.address": { vi: "Địa chỉ", en: "Address" },
  "contact.addressValue": {
    vi: "TP. Hồ Chí Minh, Việt Nam",
    en: "Ho Chi Minh City, Vietnam",
  },
  "contact.subject": { vi: "Chủ đề", en: "Subject" },
  "contact.message": { vi: "Nội dung", en: "Message" },
  "contact.send": { vi: "Gửi", en: "Send" },

  // Contact FAB (floating popup)
  "contactFab.title": { vi: "Liên hệ nhanh", en: "Quick Contact" },
  "contactFab.open": { vi: "Mở liên hệ", en: "Open contact" },
  "contactFab.close": { vi: "Đóng", en: "Close" },
  "contactFab.telegram": { vi: "Telegram", en: "Telegram" },
  "contactFab.zalo": { vi: "Zalo", en: "Zalo" },
  "contactFab.facebook": { vi: "Facebook", en: "Facebook" },

  "action.hideLine": { vi: "Ẩn đường giá", en: "Hide line" },
  "action.showLine": { vi: "Hiện đường giá", en: "Show line" },

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
  "footer.careers": { vi: "Tuyển dụng", en: "Careers" },
  "footer.risk": { vi: "Công bố rủi ro", en: "Risk Disclosure" },
  "footer.terms": { vi: "Điều khoản dịch vụ", en: "Terms of Service" },
  "footer.privacy": { vi: "Chính sách bảo mật", en: "Privacy Policy" },
  "footer.cookie": { vi: "Chính sách Cookie", en: "Cookie Policy" },
  "footer.disclaimer": { vi: "Tuyên bố miễn trừ", en: "Disclaimer" },
  "footer.partnerDisclosure": { vi: "Công bố đối tác", en: "Partner Disclosure" },
  "footer.company": { vi: "Công ty", en: "Company" },
  "footer.legal": { vi: "Pháp lý", en: "Legal" },
  "footer.tagline": {
    vi: "Nền tảng thông tin tài chính độc lập — thông tin thị trường, phân tích và giáo dục.",
    en: "Independent financial information platform — market information, analytics and education.",
  },
  "footer.disclaimerLine": {
    vi: "BTrading Market Insights là nền tảng thông tin tài chính độc lập cung cấp thông tin thị trường và nội dung giáo dục. Không có nội dung nào trên trang web này cấu thành tư vấn đầu tư.",
    en: "BTrading Market Insights is an independent financial information platform providing market information and educational content. Nothing on this website constitutes investment advice.",
  },

  "legal.related": { vi: "Tài liệu pháp lý liên quan", en: "Related legal documents" },

  // Risk warning
  "risk.title": { vi: "Công bố rủi ro", en: "Risk Disclosure" },
  "risk.body": {
    vi: "Thị trường tài chính liên quan đến rủi ro và có thể không phù hợp với mọi nhà đầu tư. BTrading Market Insights chỉ cung cấp thông tin thị trường, công cụ nghiên cứu, tài liệu giáo dục và so sánh nền tảng. Không có nội dung nào trên trang web này được xem là tư vấn tài chính, đầu tư, pháp lý hoặc thuế. Luôn tự nghiên cứu trước khi đưa ra quyết định tài chính.",
    en: "Financial markets involve risk and may not be suitable for all investors. BTrading Market Insights provides market information, research tools, educational resources and platform comparisons only. Nothing on this website should be considered financial, investment, legal or tax advice. Always perform your own research before making financial decisions.",
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
  "misc.visitBroker": { vi: "Truy cập nền tảng", en: "Visit Platform" },
  "misc.viewReview": { vi: "Xem đánh giá", en: "View Review" },
  "broker.disclaimer": {
    vi: "Thông tin nền tảng chỉ nhằm mục đích so sánh và không cấu thành tư vấn tài chính hay đầu tư.",
    en: "Platform information is for comparison purposes only and does not constitute financial or investment advice.",
  },
  "brokers.subtitle": {
    vi: "So sánh nền tảng giao dịch theo giấy phép, spread, nền tảng và mức nạp tối thiểu.",
    en: "Compare trading platforms by license, spread, platform support and minimum deposit.",
  },
  "brokers.hero.tagline": {
    vi: "So sánh nền tảng chứng khoán Việt Nam và nền tảng giao dịch toàn cầu.",
    en: "Compare Vietnam stock platforms and global trading platforms.",
  },
  "platforms.vnSection": {
    vi: "Nền tảng chứng khoán Việt Nam",
    en: "Vietnam Stock Platforms",
  },
  "platforms.globalSection": {
    vi: "Nền tảng giao dịch toàn cầu",
    en: "Global Trading Platforms",
  },
  "label.brokerageFee": { vi: "Phí môi giới", en: "Brokerage fee" },
  "brokers.stat.regulated": { vi: "Nền tảng được cấp phép", en: "Regulated Platforms" },
  "brokers.stat.avgRating": { vi: "Đánh giá trung bình", en: "Average Rating" },
  "brokers.stat.lowestSpread": { vi: "Spread thấp nhất", en: "Lowest Spread" },
  "brokers.stat.fastWithdrawal": { vi: "Rút tiền nhanh nhất", en: "Fastest Withdrawal" },
  "brokers.search": { vi: "Tìm nền tảng", en: "Search Platform" },
  "brokers.filter.rating": { vi: "Đánh giá", en: "Rating" },
  "brokers.filter.rating.45": { vi: "4.5+", en: "4.5+" },
  "brokers.filter.rating.40": { vi: "4.0+", en: "4.0+" },
  "brokers.featured.title": { vi: "Nền tảng nổi bật", en: "Featured Platforms" },
  "brokers.compare.title": {
    vi: "So sánh nền tảng phổ biến",
    en: "Compare Popular Platforms",
  },
  "brokers.compare.tableTitle": { vi: "Bảng so sánh nền tảng", en: "Platform Comparison Table" },
  "brokers.table.broker": { vi: "Nền tảng", en: "Platform" },
  "brokers.table.visit": { vi: "Truy cập", en: "Visit" },
  "brokers.guides.title": { vi: "Hướng dẫn nền tảng", en: "Platform Guides" },
  "brokers.guide.choose": { vi: "Cách chọn nền tảng", en: "How To Choose A Platform" },
  "brokers.guide.regulation": { vi: "Giải thích quy định nền tảng", en: "Platform Regulation Explained" },
  "brokers.guide.spread": { vi: "Spread vs Hoa hồng", en: "Spread vs Commission" },
  "brokers.guide.risk": { vi: "Quản lý rủi ro", en: "Risk Management" },
  "brokers.badge.bestOverall": { vi: "Được đánh giá cao", en: "Highly Rated" },
  "brokers.badge.bestBeginners": { vi: "Phù hợp người mới", en: "Beginner Friendly" },
  "brokers.badge.lowestSpread": { vi: "Spread thấp nhất", en: "Lowest Spread" },
  "brokers.badge.fastWithdrawal": { vi: "Rút tiền nhanh", en: "Fast Withdrawal" },
  "label.trustScore": { vi: "Điểm tin cậy", en: "Trust Score" },
  "label.leverage": { vi: "Đòn bẩy", en: "Leverage" },
  "label.execution": { vi: "Loại khớp lệnh", en: "Execution Type" },
  "misc.review": { vi: "Đánh giá", en: "Review" },
  "label.offer": { vi: "Ưu đãi", en: "Offer" },
  "brokers.compare.vs": { vi: "vs", en: "vs" },
  "brokers.filter.region": { vi: "Khu vực", en: "Region" },
  "brokers.filter.license": { vi: "Giấy phép", en: "License" },
  "brokers.filter.minDeposit": { vi: "Nạp tối thiểu", en: "Minimum Deposit" },
  "brokers.filter.spread": { vi: "Spread", en: "Spread" },
  "brokers.filter.platform": { vi: "Nền tảng", en: "Platform" },
  "brokers.filter.accountType": { vi: "Loại tài khoản", en: "Account Type" },
  "brokers.filter.all": { vi: "Tất cả", en: "All" },
  "brokers.filter.region.global": { vi: "Toàn cầu", en: "Global" },
  "brokers.filter.region.asia": { vi: "Châu Á", en: "Asia" },
  "brokers.filter.region.europe": { vi: "Châu Âu", en: "Europe" },
  "brokers.filter.deposit.under10": { vi: "Dưới $10", en: "Under $10" },
  "brokers.filter.deposit.under100": { vi: "Dưới $100", en: "Under $100" },
  "brokers.filter.deposit.under500": { vi: "Dưới $500", en: "Under $500" },
  "brokers.filter.spread.zero": { vi: "0.0 pips", en: "0.0 pips" },
  "brokers.filter.spread.under05": { vi: "Dưới 0.5 pips", en: "Under 0.5 pips" },
  "brokers.filter.spread.under1": { vi: "Dưới 1 pip", en: "Under 1 pip" },
  "brokers.filter.account.standard": { vi: "Standard", en: "Standard" },
  "brokers.filter.account.ecn": { vi: "ECN", en: "ECN" },
  "brokers.filter.account.islamic": { vi: "Islamic", en: "Islamic" },
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
