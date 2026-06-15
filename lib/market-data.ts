// Realistic illustrative placeholder data for MarketWall.
// None of this reflects real-time prices. For demonstration only.

export type Bi = { vi: string; en: string }

export type Ticker = {
  symbol: string
  name: Bi
  price: number
  change: number
  changePct: number
  group: "commodities" | "currencies" | "crypto" | "indices"
}

// Simple deterministic sparkline generator so SSR/CSR match.
export function spark(seed: number, points = 24, trend = 0): number[] {
  const out: number[] = []
  let v = 50 + (seed % 20)
  for (let i = 0; i < points; i++) {
    const n = Math.sin(seed * 0.7 + i * 0.9) * 6 + Math.cos(seed + i * 0.3) * 4
    v = Math.max(8, v + n * 0.4 + trend * 0.6)
    out.push(Number(v.toFixed(2)))
  }
  return out
}

export const tickerBar: Ticker[] = [
  { symbol: "GOLD", name: { vi: "Vàng", en: "Gold" }, price: 2347.8, change: 12.4, changePct: 0.53, group: "commodities" },
  { symbol: "SILVER", name: { vi: "Bạc", en: "Silver" }, price: 29.84, change: -0.21, changePct: -0.7, group: "commodities" },
  { symbol: "DXY", name: { vi: "Chỉ số USD", en: "Dollar Index" }, price: 104.32, change: -0.18, changePct: -0.17, group: "currencies" },
  { symbol: "EUR/USD", name: { vi: "EUR/USD", en: "EUR/USD" }, price: 1.0852, change: 0.0021, changePct: 0.19, group: "currencies" },
  { symbol: "USD/JPY", name: { vi: "USD/JPY", en: "USD/JPY" }, price: 157.21, change: 0.34, changePct: 0.22, group: "currencies" },
  { symbol: "BTC", name: { vi: "Bitcoin", en: "Bitcoin" }, price: 68240, change: 1420, changePct: 2.12, group: "crypto" },
  { symbol: "ETH", name: { vi: "Ethereum", en: "Ethereum" }, price: 3548, change: -42, changePct: -1.17, group: "crypto" },
  { symbol: "S&P 500", name: { vi: "S&P 500", en: "S&P 500" }, price: 5431.6, change: 18.2, changePct: 0.34, group: "indices" },
  { symbol: "NASDAQ", name: { vi: "Nasdaq", en: "Nasdaq" }, price: 17688.9, change: 95.4, changePct: 0.54, group: "indices" },
  { symbol: "VNINDEX", name: { vi: "VN-Index", en: "VN-Index" }, price: 1281.4, change: -6.8, changePct: -0.53, group: "indices" },
  { symbol: "VN30", name: { vi: "VN30", en: "VN30" }, price: 1302.7, change: -4.1, changePct: -0.31, group: "indices" },
]

export type OverviewCard = {
  symbol: string
  name: Bi
  region: Bi
  price: number
  change: number
  changePct: number
  seed: number
}

export const overviewCards: OverviewCard[] = [
  { symbol: "S&P 500", name: { vi: "S&P 500", en: "S&P 500" }, region: { vi: "Hoa Kỳ", en: "United States" }, price: 5431.6, change: 18.2, changePct: 0.34, seed: 3 },
  { symbol: "NASDAQ", name: { vi: "Nasdaq Composite", en: "Nasdaq Composite" }, region: { vi: "Hoa Kỳ", en: "United States" }, price: 17688.9, change: 95.4, changePct: 0.54, seed: 5 },
  { symbol: "DJIA", name: { vi: "Dow Jones", en: "Dow Jones" }, region: { vi: "Hoa Kỳ", en: "United States" }, price: 38712.2, change: -110.5, changePct: -0.28, seed: 9 },
  { symbol: "VNINDEX", name: { vi: "VN-Index", en: "VN-Index" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 1281.4, change: -6.8, changePct: -0.53, seed: 12 },
  { symbol: "FTSE 100", name: { vi: "FTSE 100", en: "FTSE 100" }, region: { vi: "Anh Quốc", en: "United Kingdom" }, price: 8224.5, change: 31.2, changePct: 0.38, seed: 7 },
  { symbol: "NIKKEI", name: { vi: "Nikkei 225", en: "Nikkei 225" }, region: { vi: "Nhật Bản", en: "Japan" }, price: 38420.1, change: 240.6, changePct: 0.63, seed: 14 },
  { symbol: "GOLD", name: { vi: "Vàng giao ngay", en: "Gold Spot" }, region: { vi: "Hàng hóa", en: "Commodity" }, price: 2347.8, change: 12.4, changePct: 0.53, seed: 2 },
  { symbol: "BTC", name: { vi: "Bitcoin", en: "Bitcoin" }, region: { vi: "Tiền mã hóa", en: "Crypto" }, price: 68240, change: 1420, changePct: 2.12, seed: 21 },
]

export type Currency = {
  pair: string
  price: number
  changePct: number
  weekPct: number
  monthPct: number
  seed: number
}

export const currencies: Currency[] = [
  { pair: "EUR/USD", price: 1.0852, changePct: 0.19, weekPct: 0.62, monthPct: -0.84, seed: 4 },
  { pair: "GBP/USD", price: 1.2741, changePct: 0.27, weekPct: 0.41, monthPct: 1.12, seed: 6 },
  { pair: "USD/JPY", price: 157.21, changePct: 0.22, weekPct: -0.33, monthPct: 2.05, seed: 8 },
  { pair: "USD/VND", price: 25430, changePct: 0.05, weekPct: 0.18, monthPct: 0.74, seed: 11 },
  { pair: "AUD/USD", price: 0.6642, changePct: -0.14, weekPct: -0.52, monthPct: 0.31, seed: 13 },
  { pair: "USD/CHF", price: 0.8974, changePct: 0.08, weekPct: 0.22, monthPct: -0.66, seed: 16 },
]

export type CalEvent = {
  time: string
  country: string
  flag: string
  event: Bi
  impact: "high" | "medium" | "low"
  actual: string
  forecast: string
  previous: string
}

export const calendar: CalEvent[] = [
  { time: "08:30", country: "US", flag: "🇺🇸", event: { vi: "Số đơn xin trợ cấp thất nghiệp", en: "Initial Jobless Claims" }, impact: "medium", actual: "229K", forecast: "235K", previous: "238K" },
  { time: "09:45", country: "EU", flag: "🇪🇺", event: { vi: "Quyết định lãi suất ECB", en: "ECB Interest Rate Decision" }, impact: "high", actual: "4.25%", forecast: "4.25%", previous: "4.50%" },
  { time: "12:30", country: "US", flag: "🇺🇸", event: { vi: "Chỉ số giá sản xuất (PPI)", en: "Producer Price Index (PPI)" }, impact: "high", actual: "—", forecast: "0.2%", previous: "0.5%" },
  { time: "14:00", country: "VN", flag: "🇻🇳", event: { vi: "Chỉ số sản xuất công nghiệp", en: "Industrial Production YoY" }, impact: "medium", actual: "—", forecast: "9.4%", previous: "8.9%" },
  { time: "20:00", country: "UK", flag: "🇬🇧", event: { vi: "Bài phát biểu Thống đốc BoE", en: "BoE Governor Speech" }, impact: "low", actual: "—", forecast: "—", previous: "—" },
  { time: "23:00", country: "JP", flag: "🇯🇵", event: { vi: "Cán cân thương mại", en: "Trade Balance" }, impact: "medium", actual: "—", forecast: "-¥0.42T", previous: "-¥0.66T" },
]

export type News = {
  title: Bi
  source: string
  category: Bi
  time: Bi
  seed: number
}

export const news: News[] = [
  {
    title: { vi: "Chứng khoán Mỹ tăng điểm khi nhà đầu tư chờ dữ liệu lạm phát", en: "US equities edge higher as investors await inflation data" },
    source: "MarketWall Wire", category: { vi: "Cổ phiếu", en: "Equities" }, time: { vi: "12 phút trước", en: "12 min ago" }, seed: 1,
  },
  {
    title: { vi: "Giá vàng giữ vững trên mốc 2.300 USD trong bối cảnh USD suy yếu", en: "Gold holds above $2,300 as the dollar softens" },
    source: "Global Commodities Desk", category: { vi: "Hàng hóa", en: "Commodities" }, time: { vi: "38 phút trước", en: "38 min ago" }, seed: 2,
  },
  {
    title: { vi: "Bitcoin phục hồi vượt 68.000 USD, dòng tiền ETF cải thiện", en: "Bitcoin recovers above $68,000 as ETF flows improve" },
    source: "Digital Assets Report", category: { vi: "Tiền mã hóa", en: "Crypto" }, time: { vi: "1 giờ trước", en: "1 hr ago" }, seed: 3,
  },
  {
    title: { vi: "VN-Index điều chỉnh nhẹ, khối ngoại tiếp tục bán ròng", en: "VN-Index slips as foreign investors stay net sellers" },
    source: "Vietnam Markets Today", category: { vi: "Việt Nam", en: "Vietnam" }, time: { vi: "1 giờ trước", en: "1 hr ago" }, seed: 4,
  },
  {
    title: { vi: "ECB giữ nguyên lãi suất, phát tín hiệu thận trọng về cắt giảm", en: "ECB holds rates, signals caution on future cuts" },
    source: "Europe Macro Brief", category: { vi: "Kinh tế vĩ mô", en: "Macro" }, time: { vi: "2 giờ trước", en: "2 hrs ago" }, seed: 5,
  },
  {
    title: { vi: "Lợi suất trái phiếu kho bạc Mỹ ổn định trước phiên đấu giá", en: "US Treasury yields steady ahead of auctions" },
    source: "Fixed Income Monitor", category: { vi: "Trái phiếu", en: "Bonds" }, time: { vi: "3 giờ trước", en: "3 hrs ago" }, seed: 6,
  },
]

export type HeatTile = {
  symbol: string
  name: Bi
  changePct: number
  weight: number
}

export const usHeatmap: HeatTile[] = [
  { symbol: "AAPL", name: { vi: "Apple", en: "Apple" }, changePct: 1.24, weight: 12 },
  { symbol: "MSFT", name: { vi: "Microsoft", en: "Microsoft" }, changePct: 0.82, weight: 11 },
  { symbol: "NVDA", name: { vi: "NVIDIA", en: "NVIDIA" }, changePct: 3.41, weight: 10 },
  { symbol: "AMZN", name: { vi: "Amazon", en: "Amazon" }, changePct: -0.64, weight: 8 },
  { symbol: "GOOGL", name: { vi: "Alphabet", en: "Alphabet" }, changePct: 0.45, weight: 7 },
  { symbol: "META", name: { vi: "Meta", en: "Meta" }, changePct: -1.12, weight: 6 },
  { symbol: "TSLA", name: { vi: "Tesla", en: "Tesla" }, changePct: -2.34, weight: 5 },
  { symbol: "BRK.B", name: { vi: "Berkshire", en: "Berkshire" }, changePct: 0.21, weight: 5 },
  { symbol: "JPM", name: { vi: "JPMorgan", en: "JPMorgan" }, changePct: 0.93, weight: 4 },
  { symbol: "V", name: { vi: "Visa", en: "Visa" }, changePct: -0.28, weight: 4 },
  { symbol: "XOM", name: { vi: "Exxon", en: "Exxon" }, changePct: 1.67, weight: 3 },
  { symbol: "UNH", name: { vi: "UnitedHealth", en: "UnitedHealth" }, changePct: -0.74, weight: 3 },
  { symbol: "JNJ", name: { vi: "J&J", en: "J&J" }, changePct: 0.12, weight: 3 },
  { symbol: "WMT", name: { vi: "Walmart", en: "Walmart" }, changePct: 0.58, weight: 3 },
  { symbol: "MA", name: { vi: "Mastercard", en: "Mastercard" }, changePct: -0.41, weight: 3 },
]

export const vnHeatmap: HeatTile[] = [
  { symbol: "VCB", name: { vi: "Vietcombank", en: "Vietcombank" }, changePct: -0.84, weight: 11 },
  { symbol: "VIC", name: { vi: "Vingroup", en: "Vingroup" }, changePct: 1.32, weight: 9 },
  { symbol: "VHM", name: { vi: "Vinhomes", en: "Vinhomes" }, changePct: 0.76, weight: 8 },
  { symbol: "HPG", name: { vi: "Hòa Phát", en: "Hoa Phat" }, changePct: -1.45, weight: 7 },
  { symbol: "FPT", name: { vi: "FPT", en: "FPT" }, changePct: 2.18, weight: 7 },
  { symbol: "VNM", name: { vi: "Vinamilk", en: "Vinamilk" }, changePct: 0.34, weight: 6 },
  { symbol: "GAS", name: { vi: "PV Gas", en: "PV Gas" }, changePct: -0.52, weight: 6 },
  { symbol: "MWG", name: { vi: "Thế Giới Di Động", en: "Mobile World" }, changePct: 1.04, weight: 5 },
  { symbol: "TCB", name: { vi: "Techcombank", en: "Techcombank" }, changePct: -0.91, weight: 5 },
  { symbol: "MSN", name: { vi: "Masan", en: "Masan" }, changePct: 0.62, weight: 4 },
  { symbol: "CTG", name: { vi: "VietinBank", en: "VietinBank" }, changePct: -0.38, weight: 4 },
  { symbol: "BID", name: { vi: "BIDV", en: "BIDV" }, changePct: -0.22, weight: 4 },
]

export const cryptoHeatmap: HeatTile[] = [
  { symbol: "BTC", name: { vi: "Bitcoin", en: "Bitcoin" }, changePct: 2.12, weight: 14 },
  { symbol: "ETH", name: { vi: "Ethereum", en: "Ethereum" }, changePct: -1.17, weight: 11 },
  { symbol: "BNB", name: { vi: "BNB", en: "BNB" }, changePct: 0.84, weight: 7 },
  { symbol: "SOL", name: { vi: "Solana", en: "Solana" }, changePct: 4.62, weight: 6 },
  { symbol: "XRP", name: { vi: "XRP", en: "XRP" }, changePct: -0.74, weight: 5 },
  { symbol: "ADA", name: { vi: "Cardano", en: "Cardano" }, changePct: 1.28, weight: 4 },
  { symbol: "DOGE", name: { vi: "Dogecoin", en: "Dogecoin" }, changePct: -2.05, weight: 4 },
  { symbol: "AVAX", name: { vi: "Avalanche", en: "Avalanche" }, changePct: 3.11, weight: 3 },
  { symbol: "LINK", name: { vi: "Chainlink", en: "Chainlink" }, changePct: 0.46, weight: 3 },
  { symbol: "DOT", name: { vi: "Polkadot", en: "Polkadot" }, changePct: -1.62, weight: 3 },
  { symbol: "MATIC", name: { vi: "Polygon", en: "Polygon" }, changePct: 2.74, weight: 3 },
  { symbol: "TON", name: { vi: "Toncoin", en: "Toncoin" }, changePct: 5.21, weight: 3 },
]

export type FearGreed = {
  key: string
  value: number
}

export const fearGreed: FearGreed[] = [
  { key: "fg.vnindex", value: 42 },
  { key: "fg.crypto", value: 71 },
  { key: "fg.usStocks", value: 58 },
]

export function fgLabel(value: number): string {
  if (value < 25) return "fg.extremeFear"
  if (value < 45) return "fg.fear"
  if (value < 55) return "fg.neutral"
  if (value < 75) return "fg.greed"
  return "fg.extremeGreed"
}

export type Breadth = {
  market: Bi
  advancing: number
  declining: number
  unchanged: number
  newHighs: number
  newLows: number
  aboveMa: number
}

export const breadth: Breadth[] = [
  { market: { vi: "NYSE", en: "NYSE" }, advancing: 1842, declining: 1106, unchanged: 124, newHighs: 96, newLows: 31, aboveMa: 64 },
  { market: { vi: "Nasdaq", en: "Nasdaq" }, advancing: 2104, declining: 1588, unchanged: 210, newHighs: 142, newLows: 58, aboveMa: 57 },
  { market: { vi: "HOSE", en: "HOSE" }, advancing: 168, declining: 214, unchanged: 62, newHighs: 14, newLows: 9, aboveMa: 48 },
]

export type Mover = {
  symbol: string
  name: Bi
  price: number
  changePct: number
}

export const gainers: Mover[] = [
  { symbol: "TON", name: { vi: "Toncoin", en: "Toncoin" }, price: 7.42, changePct: 5.21 },
  { symbol: "SOL", name: { vi: "Solana", en: "Solana" }, price: 148.6, changePct: 4.62 },
  { symbol: "NVDA", name: { vi: "NVIDIA", en: "NVIDIA" }, price: 131.8, changePct: 3.41 },
  { symbol: "AVAX", name: { vi: "Avalanche", en: "Avalanche" }, price: 36.2, changePct: 3.11 },
  { symbol: "FPT", name: { vi: "FPT", en: "FPT" }, price: 134.5, changePct: 2.18 },
]

export const losers: Mover[] = [
  { symbol: "TSLA", name: { vi: "Tesla", en: "Tesla" }, price: 178.2, changePct: -2.34 },
  { symbol: "DOGE", name: { vi: "Dogecoin", en: "Dogecoin" }, price: 0.158, changePct: -2.05 },
  { symbol: "DOT", name: { vi: "Polkadot", en: "Polkadot" }, price: 6.18, changePct: -1.62 },
  { symbol: "HPG", name: { vi: "Hòa Phát", en: "Hoa Phat" }, price: 28.4, changePct: -1.45 },
  { symbol: "ETH", name: { vi: "Ethereum", en: "Ethereum" }, price: 3548, changePct: -1.17 },
]

export type WatchItem = {
  symbol: string
  name: Bi
  price: number
  changePct: number
  seed: number
}

export const watchlist: WatchItem[] = [
  { symbol: "AAPL", name: { vi: "Apple", en: "Apple" }, price: 214.3, changePct: 1.24, seed: 2 },
  { symbol: "BTC", name: { vi: "Bitcoin", en: "Bitcoin" }, price: 68240, changePct: 2.12, seed: 5 },
  { symbol: "GOLD", name: { vi: "Vàng", en: "Gold" }, price: 2347.8, changePct: 0.53, seed: 8 },
  { symbol: "VNINDEX", name: { vi: "VN-Index", en: "VN-Index" }, price: 1281.4, changePct: -0.53, seed: 11 },
  { symbol: "EUR/USD", name: { vi: "EUR/USD", en: "EUR/USD" }, price: 1.0852, changePct: 0.19, seed: 14 },
]

export type Broker = {
  name: string
  blurb: Bi
  rating: number
  minDeposit: string
  assets: Bi
  tag: Bi
}

export const brokers: Broker[] = [
  {
    name: "NorthBridge Markets",
    blurb: { vi: "Nền tảng dữ liệu đa tài sản với công cụ phân tích nâng cao.", en: "Multi-asset data platform with advanced analytics tools." },
    rating: 4.8, minDeposit: "$100", assets: { vi: "Cổ phiếu, Chỉ số, Hàng hóa", en: "Stocks, Indices, Commodities" }, tag: { vi: "Phổ biến", en: "Popular" },
  },
  {
    name: "Meridian Capital",
    blurb: { vi: "Truy cập thị trường toàn cầu với phí cạnh tranh và dữ liệu thời gian thực.", en: "Global market access with competitive fees and real-time data." },
    rating: 4.6, minDeposit: "$250", assets: { vi: "Cổ phiếu, ETF, Trái phiếu", en: "Stocks, ETFs, Bonds" }, tag: { vi: "Cao cấp", en: "Premium" },
  },
  {
    name: "Apex Securities",
    blurb: { vi: "Giao diện chuyên nghiệp, dữ liệu chuyên sâu cho nhà phân tích.", en: "Professional interface with in-depth data for analysts." },
    rating: 4.5, minDeposit: "$0", assets: { vi: "Cổ phiếu, Tiền mã hóa", en: "Stocks, Crypto" }, tag: { vi: "Mới", en: "New" },
  },
]

export type Notification = {
  title: Bi
  detail: Bi
  time: Bi
}

export const notifications: Notification[] = [
  {
    title: { vi: "VN-Index chạm ngưỡng hỗ trợ", en: "VN-Index hits support level" },
    detail: { vi: "Chỉ số giảm xuống gần vùng 1.280 điểm.", en: "Index slips toward the 1,280 zone." },
    time: { vi: "5 phút trước", en: "5 min ago" },
  },
  {
    title: { vi: "Bitcoin vượt 68.000 USD", en: "Bitcoin crosses $68,000" },
    detail: { vi: "Biến động 24h tăng hơn 2%.", en: "Up more than 2% over 24 hours." },
    time: { vi: "22 phút trước", en: "22 min ago" },
  },
  {
    title: { vi: "Lịch kinh tế: PPI Mỹ", en: "Calendar: US PPI" },
    detail: { vi: "Dữ liệu công bố lúc 19:30 (giờ VN).", en: "Data due at 12:30 GMT." },
    time: { vi: "1 giờ trước", en: "1 hr ago" },
  },
]
