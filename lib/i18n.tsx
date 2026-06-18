"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"

export type Lang = "vi" | "en"

/** Default UI language when no saved preference exists. */
export const defaultLocale: Lang = "vi"

/** localStorage key for persisted language (`language`). */
export const LANG_STORAGE_KEY = "language"

function readStoredLang(): Lang {
  if (typeof window === "undefined") return defaultLocale
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    if (stored === "en" || stored === "vi") return stored
  } catch {
    /* ignore */
  }
  return defaultLocale
}

function persistLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang)
    document.documentElement.lang = lang === "vi" ? "vi" : "en"
  } catch {
    /* ignore */
  }
}

type Dict = Record<string, { vi: string; en: string }>

// Central dictionary. Each key maps to a Vietnamese + English string.
const dict: Dict = {
  // Nav
  "nav.dashboard": { vi: "Tổng Quan", en: "Dashboard" },
  "nav.dailyAnalysis": { vi: "Phân Tích Hằng Ngày", en: "Daily Analysis" },
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
  "search.noResults": { vi: "Không tìm thấy mã cổ phiếu", en: "No symbols found" },
  "action.theme": { vi: "Giao diện", en: "Theme" },
  "action.theme.light": { vi: "Chuyển sang giao diện sáng", en: "Switch to light mode" },
  "action.theme.dark": { vi: "Chuyển sang giao diện tối", en: "Switch to dark mode" },
  "action.theme.toggle": { vi: "Chuyển giao diện", en: "Toggle theme" },
  "action.login": { vi: "Đăng nhập", en: "Login" },
  "action.register": { vi: "Đăng ký", en: "Register" },
  "action.logout": { vi: "Đăng xuất", en: "Log out" },
  "action.notifications": { vi: "Thông báo", en: "Notifications" },
  "action.viewAll": { vi: "Xem tất cả", en: "View all" },
  "action.language": { vi: "Ngôn ngữ", en: "Language" },

  // Auth
  "auth.loginTitle": { vi: "Đăng nhập", en: "Sign in" },
  "auth.registerTitle": { vi: "Tạo tài khoản", en: "Create account" },
  "auth.email": { vi: "Email", en: "Email" },
  "auth.password": { vi: "Mật khẩu", en: "Password" },
  "auth.name": { vi: "Tên (tuỳ chọn)", en: "Name (optional)" },
  "auth.signingIn": { vi: "Đang đăng nhập…", en: "Signing in…" },
  "auth.creatingAccount": { vi: "Đang tạo tài khoản…", en: "Creating account…" },
  "auth.loading": { vi: "Đang tải…", en: "Loading…" },
  "auth.invalidCredentials": {
    vi: "Email hoặc mật khẩu không đúng.",
    en: "Invalid email or password.",
  },
  "auth.registerFailed": {
    vi: "Không thể tạo tài khoản. Vui lòng thử lại.",
    en: "Could not create account. Please try again.",
  },
  "auth.noAccount": { vi: "Chưa có tài khoản?", en: "No account yet?" },
  "auth.haveAccount": { vi: "Đã có tài khoản?", en: "Already have an account?" },

  // Section titles
  "sec.overview": { vi: "Tổng quan thị trường", en: "Market Overview" },
  "sec.currencies": { vi: "Hiệu suất tiền tệ chính", en: "Major Currency Performance" },
  "sec.currencyStrength": { vi: "Sức mạnh tiền tệ", en: "Currency Strength" },
  "sec.currencyStrength1D": { vi: "Sức mạnh tiền tệ (1D)", en: "Currency Strength (1D)" },
  "sec.calendar": { vi: "Lịch kinh tế toàn cầu", en: "Global Economic Calendar" },
  "sec.news": { vi: "Tin nóng", en: "Breaking News" },
  "sec.usHeatmap": { vi: "Bản đồ nhiệt thị trường Mỹ", en: "US Market Heatmap" },
  "sec.vnHeatmap": { vi: "Bản đồ nhiệt thị trường Việt Nam", en: "Vietnam Market Heatmap" },
  "sec.vnDashboard": { vi: "Bảng giá thị trường Việt Nam", en: "Vietnam Market Dashboard" },
  "vnDashboard.topVolume": { vi: "Khối lượng cao nhất", en: "Top Volume" },
  "vnDashboard.topValue": { vi: "GTGD cao nhất", en: "Top Trading Value" },
  "vnDashboard.tradingValue": { vi: "GTGD", en: "Trading Value" },
  "vnDashboard.topForeignBuy": { vi: "Mua ròng NN cao nhất", en: "Top Foreign Buy" },
  "vnDashboard.topForeignSell": { vi: "Bán ròng NN cao nhất", en: "Top Foreign Sell" },
  "vnDashboard.metric": { vi: "Chỉ số", en: "Metric" },
  "vnDashboard.sourceKbs": { vi: "Nguồn: KBS / Vnstock", en: "Source: KBS / Vnstock" },
  "vnDashboard.sourceVps": { vi: "Nguồn: VPS (lot × 10 cổ phiếu)", en: "Source: VPS (lot × 10 shares)" },
  "vnDashboard.sourceMock": { vi: "Dữ liệu mẫu", en: "Sample data" },
  "vnDashboard.volumeShares": { vi: "KL (CP)", en: "Vol (shares)" },
  "sec.vnAnalytics": { vi: "Phân tích thị trường Việt Nam", en: "Vietnam Market Analytics" },
  "vnAnalytics.tabBreadth": { vi: "Biến động", en: "Breadth" },
  "vnAnalytics.tabForeign": { vi: "Nước ngoài", en: "Foreign" },
  "vnAnalytics.tabProprietary": { vi: "Tự doanh", en: "Proprietary" },
  "vnAnalytics.tabLiquidity": { vi: "Thanh khoản", en: "Liquidity" },
  "vnAnalytics.advancing": { vi: "Tăng giá", en: "Advancing" },
  "vnAnalytics.declining": { vi: "Giảm giá", en: "Declining" },
  "vnAnalytics.unchanged": { vi: "Đứng giá", en: "Unchanged" },
  "vnAnalytics.advancingValue": { vi: "GTGD mã tăng", en: "Advancing value" },
  "vnAnalytics.decliningValue": { vi: "GTGD mã giảm", en: "Declining value" },
  "vnAnalytics.unchangedValue": { vi: "GTGD mã đứng", en: "Unchanged value" },
  "vnAnalytics.breadthUnavailable": {
    vi: "Dữ liệu biến động chỉ khả dụng khi có báo giá thời gian thực.",
    en: "Breadth analytics require live quotes.",
  },
  "vnAnalytics.foreignBuyVol": { vi: "KL mua NN", en: "Foreign buy vol" },
  "vnAnalytics.foreignSellVol": { vi: "KL bán NN", en: "Foreign sell vol" },
  "vnAnalytics.foreignNetVol": { vi: "KL ròng NN", en: "Net foreign vol" },
  "vnAnalytics.foreignBuyVal": { vi: "GT mua NN", en: "Foreign buy value" },
  "vnAnalytics.foreignSellVal": { vi: "GT bán NN", en: "Foreign sell value" },
  "vnAnalytics.foreignNetVal": { vi: "GT ròng NN", en: "Net foreign value" },
  "vnAnalytics.topNetForeign": { vi: "Top mua/bán ròng NN", en: "Top net foreign buy/sell" },
  "vnAnalytics.foreignUnavailable": {
    vi: "Dữ liệu dòng tiền nước ngoài không khả dụng.",
    en: "Foreign flow data is unavailable.",
  },
  "vnAnalytics.historicalForeignUnavailable": {
    vi: "Lịch sử dòng tiền nước ngoài không khả dụng",
    en: "Historical foreign flow unavailable",
  },
  "vnAnalytics.range.today": { vi: "Hôm nay", en: "Today" },
  "vnAnalytics.range.7d": { vi: "7 ngày", en: "7 days" },
  "vnAnalytics.range.28d": { vi: "28 ngày", en: "28 days" },
  "vnAnalytics.proprietaryUnavailable": {
    vi: "Dữ liệu giao dịch tự doanh không có từ các nguồn miễn phí hiện tại.",
    en: "Proprietary trading data is not available from current free providers.",
  },
  "vnAnalytics.totalValue": { vi: "Tổng GTGD", en: "Total value" },
  "vnAnalytics.totalVolume": { vi: "Tổng KL", en: "Total volume" },
  "vnAnalytics.prevSessionVol": { vi: "KL phiên trước (VNINDEX)", en: "Prev session vol (VNINDEX)" },
  "vnAnalytics.topLiquidity": { vi: "Thanh khoản cao nhất", en: "Top liquidity" },
  "vnAnalytics.intradayUnavailable": {
    vi: "Không có dữ liệu thanh khoản theo thời gian trong phiên — hiển thị snapshot.",
    en: "Intraday liquidity buckets unavailable — showing session snapshot.",
  },
  "vnAnalytics.liquidityUnavailable": {
    vi: "Dữ liệu thanh khoản chỉ khả dụng khi có báo giá thời gian thực.",
    en: "Liquidity analytics require live quotes.",
  },
  "vnAnalytics.sourceLive": { vi: "HOSE + HNX + UPCOM", en: "HOSE + HNX + UPCOM" },
  "vnAnalytics.sourceMock": { vi: "Chờ dữ liệu thực", en: "Awaiting live data" },
  "foreignFlow.title": { vi: "Dòng tiền nước ngoài", en: "Foreign Flow" },
  "proprietaryTrading.title": {
    vi: "Tự doanh - Giá trị mua bán ròng",
    en: "Proprietary Trading - Net Buy/Sell Value",
  },
  "proprietaryTrading.unavailable": {
    vi: "Dữ liệu tự doanh chưa khả dụng từ nguồn miễn phí hiện tại.",
    en: "Proprietary trading data is not yet available from current free sources.",
  },
  "proprietaryTrading.rangeToday": { vi: "Hôm nay", en: "Today" },
  "proprietaryTrading.rangeSessions": { vi: "10 phiên", en: "10 sessions" },
  "proprietaryTrading.buyValue": { vi: "Tổng mua", en: "Total buy" },
  "proprietaryTrading.sellValue": { vi: "Tổng bán", en: "Total sell" },
  "proprietaryTrading.netValue": { vi: "Giá trị ròng", en: "Net value" },
  "proprietaryTrading.netBuy": { vi: "Mua ròng", en: "Net buy" },
  "proprietaryTrading.netSell": { vi: "Bán ròng", en: "Net sell" },
  "proprietaryTrading.topNetBuy": { vi: "Top mua ròng", en: "Top net buy" },
  "proprietaryTrading.topNetSell": { vi: "Top bán ròng", en: "Top net sell" },
  "proprietaryTrading.topBuy": { vi: "Top mua tự doanh", en: "Top proprietary buy" },
  "proprietaryTrading.topSell": { vi: "Top bán tự doanh", en: "Top proprietary sell" },
  "proprietaryTrading.netBuyChart": { vi: "Mua ròng 10 phiên", en: "10-session net buy" },
  "proprietaryTrading.unitBillionVnd": { vi: "Đơn vị: tỷ VND", en: "Unit: billion VND" },
  "proprietaryTrading.source": { vi: "Nguồn", en: "Source" },
  "proprietaryTrading.eodLabel": { vi: "Cập nhật sau phiên", en: "Updated after session" },
  "foreignFlow.netSell": { vi: "Bán ròng", en: "Net Sell" },
  "foreignFlow.netBuy": { vi: "Mua ròng", en: "Net Buy" },
  "foreignFlow.modeValue": { vi: "Giá trị (tỷ)", en: "Value (B)" },
  "foreignFlow.modeVolume": { vi: "Khối lượng", en: "Volume" },
  "foreignFlow.value": { vi: "Giá trị", en: "Value" },
  "foreignFlow.volume": { vi: "Khối lượng", en: "Volume" },
  "foreignFlow.unitBillionVnd": { vi: "Đơn vị: tỷ VND", en: "Unit: billion VND" },
  "foreignFlow.unitShares": { vi: "Đơn vị: cổ phiếu", en: "Unit: shares" },
  "foreignFlow.periodEstimate": {
    vi: "7D/30D ước tính từ dòng ngày × số phiên",
    en: "7D/30D estimated from daily flow × sessions",
  },
  "label.sector": { vi: "Ngành", en: "Sector" },
  "sec.cryptoHeatmap": { vi: "Bản đồ nhiệt tiền mã hóa", en: "Crypto Heatmap" },
  "sec.fearGreed": { vi: "Chỉ số Sợ hãi & Tham lam", en: "Fear & Greed Index" },
  "sec.dailyAnalysis": { vi: "Phân Tích Hằng Ngày", en: "Daily Analysis" },
  "sec.dailyAnalysisSub": {
    vi: "Tổng hợp các nhận định quan trọng về thị trường mỗi ngày",
    en: "Daily summary of key market views",
  },
  "dailyAnalysis.vnBadge": { vi: "VNINDEX", en: "VNINDEX" },
  "dailyAnalysis.goldBadge": { vi: "Vàng", en: "Gold" },
  "dailyAnalysis.vnTitle": {
    vi: "VN-Index duy trì xu hướng tích cực trong phiên",
    en: "VN-Index maintains a positive intraday trend",
  },
  "dailyAnalysis.goldTitle": { vi: "Phân Tích Vàng", en: "Gold Analysis" },
  "dailyAnalysis.vnSummary": {
    vi: "Thị trường trong nước tiếp tục được hỗ trợ bởi dòng tiền nội địa và nhóm ngân hàng dẫn dắt.",
    en: "The local market continues to be supported by domestic liquidity and leading banks.",
  },
  "dailyAnalysis.goldSummary": {
    vi: "Giá vàng dao động trong biên hẹp khi nhà đầu tư theo dõi dữ liệu lạm phát và định hướng lãi suất.",
    en: "Gold trades in a tight range as investors watch inflation data and rate guidance.",
  },
  "dailyAnalysis.trend": { vi: "Xu hướng", en: "Trend" },
  "dailyAnalysis.resistance": { vi: "Kháng cự", en: "Resistance" },
  "dailyAnalysis.support": { vi: "Hỗ trợ", en: "Support" },
  "dailyAnalysis.vnTrend": {
    vi: "Tăng ngắn hạn với nhịp điều chỉnh lành mạnh",
    en: "Short-term uptrend with healthy pullbacks",
  },
  "dailyAnalysis.vnResistance": { vi: "1.290 – 1.295 điểm", en: "1,290 – 1,295 pts" },
  "dailyAnalysis.vnSupport": { vi: "1.265 – 1.270 điểm", en: "1,265 – 1,270 pts" },
  "dailyAnalysis.goldTrend": {
    vi: "Sideway trong vùng 2.320 – 2.380",
    en: "Sideways between 2,320 – 2,380",
  },
  "dailyAnalysis.goldResistance": { vi: "2.380 – 2.395 USD/oz", en: "2,380 – 2,395 USD/oz" },
  "dailyAnalysis.goldSupport": { vi: "2.320 – 2.335 USD/oz", en: "2,320 – 2,335 USD/oz" },
  "dailyAnalysis.readMore": { vi: "Đọc Thêm →", en: "Read More →" },
  "sec.breadth": { vi: "Độ rộng thị trường", en: "Market Breadth" },
  "sec.topMovers": { vi: "Biến động mạnh nhất", en: "Top Movers" },
  "sec.watchlist": { vi: "Danh mục theo dõi", en: "Watchlist" },
  "watchlist.privacy": {
    vi: "Lưu trên thiết bị này. Không cần đăng nhập.",
    en: "Stored on this device only. No login required.",
  },
  "watchlist.synced": {
    vi: "Đồng bộ với tài khoản của bạn.",
    en: "Synced to your account.",
  },
  "watchlist.empty": {
    vi: "Thêm mã để theo dõi giá.",
    en: "Add symbols to track prices.",
  },
  "watchlist.addSymbol": { vi: "Thêm mã", en: "Add symbol" },
  "watchlist.remove": { vi: "Xóa khỏi danh mục", en: "Remove from watchlist" },

  // Symbol detail modal
  "symbolDetail.overview": { vi: "Tổng quan", en: "Overview" },
  "symbolDetail.chart": { vi: "Biểu đồ", en: "Chart" },
  "symbolDetail.financials": { vi: "Tài chính", en: "Financials" },
  "symbolDetail.news": { vi: "Tin tức", en: "News" },
  "symbolDetail.viewFullPage": { vi: "Xem trang đầy đủ", en: "View full page" },
  "symbolDetail.addWatchlist": { vi: "Thêm vào danh mục", en: "Add to watchlist" },
  "symbolDetail.exchange": { vi: "Sàn", en: "Exchange" },
  "symbolDetail.disclaimer": {
    vi: "Dữ liệu minh họa, có thể trễ. Không phải lời khuyên đầu tư.",
    en: "Illustrative data, may be delayed. Not investment advice.",
  },
  "symbolDetail.financialsPlaceholder": {
    vi: "Báo cáo tài chính sẽ được cập nhật trong phiên bản tiếp theo.",
    en: "Financial statements will be available in a future release.",
  },
  "symbolDetail.newsPlaceholder": {
    vi: "Tin tức liên quan đến mã sẽ hiển thị tại đây.",
    en: "Related news for this symbol will appear here.",
  },

  // Heatmap detail modal
  "heatmapDetail.tab.overview": { vi: "Tổng quan", en: "Overview" },
  "heatmapDetail.tab.chart": { vi: "Biểu đồ", en: "Chart" },
  "heatmapDetail.tab.profile": { vi: "Hồ sơ", en: "Profile" },
  "heatmapDetail.tab.shareholders": { vi: "Cổ đông", en: "Shareholders" },
  "heatmapDetail.tab.dividends": { vi: "Cổ tức", en: "Dividends" },
  "heatmapDetail.tab.financials": { vi: "Tài chính", en: "Financials" },
  "heatmapDetail.tab.historical": { vi: "Giá quá khứ", en: "Historical Prices" },
  "heatmapDetail.exchange": { vi: "Sàn", en: "Exchange" },
  "heatmapDetail.sector": { vi: "Ngành", en: "Sector" },
  "heatmapDetail.open": { vi: "Mở cửa", en: "Open" },
  "heatmapDetail.prevClose": { vi: "Đóng cửa trước", en: "Prev close" },
  "heatmapDetail.pe": { vi: "P/E", en: "P/E" },
  "heatmapDetail.eps": { vi: "EPS", en: "EPS" },
  "heatmapDetail.dividendYield": { vi: "Cổ tức (%)", en: "Dividend yield" },
  "heatmapDetail.week52High": { vi: "Cao 52 tuần", en: "52W high" },
  "heatmapDetail.week52Low": { vi: "Thấp 52 tuần", en: "52W low" },
  "heatmapDetail.revenue": { vi: "Doanh thu", en: "Revenue" },
  "heatmapDetail.netIncome": { vi: "Lợi nhuận ròng", en: "Net income" },
  "heatmapDetail.totalAssets": { vi: "Tổng tài sản", en: "Total assets" },
  "heatmapDetail.totalLiabilities": { vi: "Tổng nợ", en: "Total liabilities" },
  "heatmapDetail.roe": { vi: "ROE", en: "ROE" },
  "heatmapDetail.roa": { vi: "ROA", en: "ROA" },
  "heatmapDetail.watch": { vi: "Theo dõi", en: "Watch" },
  "heatmapDetail.chartLoading": { vi: "Đang tải biểu đồ...", en: "Loading chart..." },
  "heatmapDetail.chartFallback": {
    vi: "Biểu đồ không khả dụng. Dữ liệu minh họa.",
    en: "Chart unavailable. Illustrative data.",
  },
  "heatmapDetail.vnChartPreparing": {
    vi: "Biểu đồ nội bộ cho mã Việt Nam đang được chuẩn bị.",
    en: "Internal chart for Vietnam symbols is being prepared.",
  },
  "heatmapDetail.noDividends": {
    vi: "Không có dữ liệu cổ tức.",
    en: "No dividend data available.",
  },
  "heatmapDetail.disclaimer": {
    vi: "Dữ liệu minh họa, có thể trễ. Không phải lời khuyên đầu tư.",
    en: "Illustrative data, may be delayed. Not investment advice.",
  },

  "action.close": { vi: "Đóng", en: "Close" },
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
  "heatmap.modeSectorVolume": { vi: "Ngành cổ phiếu", en: "Sector Volume" },
  "heatmap.modeMarketCap": { vi: "Vốn hóa", en: "Market Cap" },
  "heatmap.modeForeignFlow": { vi: "Nước ngoài", en: "Foreign" },
  "heatmap.modeProprietaryFlow": { vi: "Tự doanh", en: "Proprietary" },
  "heatmap.groupBySector": { vi: "Theo ngành", en: "By Sector" },
  "heatmap.groupByIndustry": { vi: "Theo ngành con", en: "By Industry" },
  "heatmap.groupByCategory": { vi: "Theo loại", en: "By Category" },
  "heatmap.groupByMarketCap": { vi: "Theo vốn hóa", en: "By Market Cap" },
  "heatmap.sizeTradingValue": { vi: "GTGD", en: "Trading Value" },
  "heatmap.sizeVolume": { vi: "Khối lượng", en: "Volume" },
  "heatmap.sizeMarketCap": { vi: "Vốn hóa", en: "Market Cap" },
  "heatmap.sizeDollarVolume": { vi: "Thanh khoản USD", en: "Dollar Volume" },
  "heatmap.tradingValue": { vi: "Giá trị giao dịch", en: "Trading Value" },
  "heatmap.marketCap": { vi: "Vốn hóa", en: "Market Cap" },
  "heatmap.sector": { vi: "Ngành", en: "Sector" },
  "heatmap.industry": { vi: "Ngành con", en: "Industry" },
  "sector.banking": { vi: "Tài chính", en: "Finance" },
  "sector.realEstate": { vi: "Bất động sản", en: "Real Estate" },
  "sector.securities": { vi: "Tài chính", en: "Finance" },
  "sector.steel": { vi: "Vật liệu cơ bản", en: "Basic Materials" },
  "sector.oilGas": { vi: "Năng lượng", en: "Energy" },
  "sector.retail": { vi: "Hàng tiêu dùng", en: "Consumer Discretionary" },
  "sector.technology": { vi: "Công nghệ", en: "Technology" },
  "sector.utilities": { vi: "Các dịch vụ hạ tầng", en: "Infrastructure Services" },
  "sector.industrial": { vi: "Công nghiệp", en: "Industrials" },
  "sector.consumer": { vi: "Hàng tiêu dùng cơ bản", en: "Consumer Staples" },
  "sector.insurance": { vi: "Tài chính", en: "Finance" },
  "sector.chemicals": { vi: "Vật liệu cơ bản", en: "Basic Materials" },
  "sector.healthcare": { vi: "Hàng tiêu dùng cơ bản", en: "Consumer Staples" },
  "sector.unclassified": { vi: "Chưa phân loại", en: "Unclassified" },
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
    vi: "Trung Tâm Dữ Liệu Thị Trường",
    en: "Market Intelligence Starts Here",
  },
  "ad.brokerPromo.subtitle": {
    vi: "Theo dõi thị trường. So sánh nền tảng. Ra quyết định tốt hơn.",
    en: "Track markets. Compare platforms. Make better decisions.",
  },
  "ad.brokerPromo.cta": { vi: "Xem nền tảng", en: "View Platforms" },
  "ad.proBroker.title": {
    vi: "Trở Thành Đối Tác BTrading",
    en: "Partner With BTrading",
  },
  "ad.proBroker.subtitle": {
    vi: "Phát triển mạng lưới tài chính cùng dữ liệu thị trường đáng tin cậy.",
    en: "Build your financial network with trusted market insights.",
  },
  "ad.proBroker.b1": { vi: "Hoa hồng cao", en: "High commission" },
  "ad.proBroker.b2": { vi: "Hỗ trợ toàn diện", en: "Full support" },
  "ad.proBroker.b3": { vi: "Công nghệ tiên tiến", en: "Advanced technology" },
  "ad.proBroker.b4": { vi: "Phát triển bền vững", en: "Sustainable growth" },
  "ad.proBroker.cta": { vi: "Liên hệ", en: "Contact Us" },

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
  "contact.sendEmail": { vi: "Gửi email", en: "Send email" },
  "contact.chatZalo": { vi: "Chat Zalo", en: "Chat on Zalo" },

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
  "overview.forex": { vi: "Tiền tệ", en: "Currencies" },

  // Currency strength ranks
  "strength.strongest": { vi: "Mạnh nhất", en: "Strongest" },
  "strength.veryStrong": { vi: "Rất mạnh", en: "Very Strong" },
  "strength.strong": { vi: "Mạnh", en: "Strong" },
  "strength.neutral": { vi: "Trung lập", en: "Neutral" },
  "strength.weak": { vi: "Yếu", en: "Weak" },
  "strength.weakest": { vi: "Yếu nhất", en: "Weakest" },
  "strength.coveragePartial": {
    vi: "Dữ liệu một phần",
    en: "Partial data",
  },
  "strength.coverageDegraded": {
    vi: "Độ phủ hạn chế",
    en: "Limited coverage",
  },
  "strength.lastUpdated": {
    vi: "Cập nhật lúc {time}",
    en: "Last updated {time}",
  },
  "strength.updatesEvery5Min": {
    vi: "Cập nhật mỗi 5 phút",
    en: "Updates every 5 minutes",
  },
  "strength.footerSource": { vi: "Nguồn", en: "Source" },
  "strength.footerCoverage": { vi: "Độ phủ", en: "Coverage" },
  "strength.footerUpdated": { vi: "Cập nhật", en: "Updated" },
  "strength.footerNextUpdate": { vi: "Cập nhật tiếp", en: "Next update" },
  "strength.footerCadence": { vi: "Chu kỳ làm mới", en: "Refresh cadence" },
  "strength.footerCadenceValue": { vi: "5 phút", en: "5 min" },
  "strength.sourceYahoo": { vi: "Yahoo Finance", en: "Yahoo Finance" },
  "strength.sourceYahooEcb": { vi: "Yahoo Finance + ECB", en: "Yahoo Finance + ECB" },
  "strength.coverageIdeal": { vi: "ideal", en: "ideal" },
  "strength.coverageValidLabel": { vi: "valid", en: "valid" },
  "strength.coverageDegradedLabel": { vi: "degraded", en: "degraded" },
  "foreignFlow.today": { vi: "Hôm nay", en: "Today" },
  "foreignFlow.historicalUnavailable": {
    vi: "Lịch sử dòng tiền nước ngoài không có từ các nguồn miễn phí hiện tại.",
    en: "Historical foreign-flow data not available from current free providers.",
  },

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
  "error.marketDataUnavailable": {
    vi: "Thông tin thị trường tạm thời chưa khả dụng.",
    en: "Market data temporarily unavailable.",
  },
  "error.currencyStrengthUnavailable": {
    vi: "Sức mạnh tiền tệ tạm thời chưa khả dụng.",
    en: "Currency strength temporarily unavailable.",
  },
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
  "platforms.vnSectionDesc": {
    vi: "So sánh phí môi giới, ưu đãi và giấy phép giữa các CTCK Việt Nam.",
    en: "Compare brokerage fees, offers, and licenses across Vietnamese securities firms.",
  },
  "platforms.globalSection": {
    vi: "Nền tảng giao dịch toàn cầu",
    en: "Global Trading Platforms",
  },
  "platforms.globalSectionDesc": {
    vi: "So sánh spread, hoàn phí, ưu đãi chịu giá và chương trình khuyến mãi.",
    en: "Compare spread, rebates, price tolerance benefits, and promotional programs.",
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
  "brokers.compare.metric": { vi: "Tiêu chí", en: "Metric" },
  "brokers.compare.score": { vi: "Tổng điểm", en: "Overall Score" },
  "brokers.detail.subtitle": {
    vi: "Thông tin nền tảng, giấy phép và điều kiện giao dịch.",
    en: "Platform overview, regulation, and trading conditions.",
  },
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
  "label.withdrawal": { vi: "Thời gian rút tiền", en: "Withdrawal Time" },
  "label.execution": { vi: "Loại khớp lệnh", en: "Execution Type" },
  "misc.review": { vi: "Đánh giá", en: "Review" },
  "label.offer": { vi: "Ưu đãi", en: "Offer" },
  "label.promotions": { vi: "Ưu đãi", en: "Promotions" },
  "label.rebatePerLot": { vi: "Mức hoàn phí trên lot", en: "Rebate per lot" },
  "label.priceTolerance": { vi: "Ưu đãi chịu giá", en: "Price tolerance benefit" },
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
  "brokers.filter.highRating": { vi: "Đánh giá cao", en: "Highly rated" },
  "brokers.filter.highRebate": { vi: "Hoàn phí cao", en: "High rebate" },
  "brokers.filter.highLeverage": { vi: "Đòn bẩy cao", en: "High leverage" },
  "brokers.filter.manyPromotions": { vi: "Ưu đãi nhiều", en: "Many promotions" },
  "brokers.filter.lowSpread": { vi: "Spread thấp", en: "Low spread" },
  "brokers.filter.marketInterest": { vi: "Quan tâm thị trường", en: "Market interest" },
  "brokers.filter.clearAll": { vi: "Xóa bộ lọc", en: "Clear filters" },
  "brokers.filter.noResults": {
    vi: "Không có nền tảng nào khớp với bộ lọc đã chọn.",
    en: "No platforms match the selected filters.",
  },
  "brokers.filter.resultsCount": { vi: "{count} nền tảng", en: "{count} platforms" },
  "brokers.filter.activeHint": {
    vi: "Hiển thị nền tảng khớp tất cả bộ lọc đang bật",
    en: "Showing platforms that match all active filters",
  },
  "label.marketInterest": { vi: "Quan tâm thị trường", en: "Market interest" },
  "label.marketInterest.high": { vi: "Cao", en: "High" },
  "label.marketInterest.medium": { vi: "Trung bình", en: "Medium" },
  "label.marketInterest.low": { vi: "Thấp", en: "Low" },
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
  const [lang, setLangState] = useState<Lang>(defaultLocale)

  useEffect(() => {
    const stored = readStoredLang()
    setLangState(stored)
    document.documentElement.lang = stored === "vi" ? "vi" : "en"
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    persistLang(next)
  }, [])

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
