import { type Bi } from "@/lib/market-utils"

export type HeatmapTile = {
  symbol: string
  name: Bi
  changePercent: number
  weight: number
  price?: number
}

export type HeatmapMarketId = "vn" | "us" | "crypto"

export type VnExchangeId = "hose" | "hnx" | "upcom" | "derivatives"

export type HeatmapExchange = {
  id: VnExchangeId
  labelKey: string
  tiles: HeatmapTile[]
}

export type HeatmapMarket = {
  id: HeatmapMarketId
  labelKey: string
  flag: string
  tiles?: HeatmapTile[]
  exchanges?: HeatmapExchange[]
}

export type HeatmapData = {
  markets: HeatmapMarket[]
}

function heatTile(
  symbol: string,
  name: Bi,
  weight: number,
  changePercent: number,
): HeatmapTile {
  return { symbol, name, weight, changePercent }
}

const hoseSymbols: [string, Bi, number, number][] = [
  ["VCB", { vi: "Vietcombank", en: "Vietcombank" }, 12, 2.34],
  ["VIC", { vi: "Vingroup", en: "Vingroup" }, 11, 2.28],
  ["VHM", { vi: "Vinhomes", en: "Vinhomes" }, 10, 2.15],
  ["BID", { vi: "BIDV", en: "BIDV" }, 9, 1.82],
  ["CTG", { vi: "VietinBank", en: "VietinBank" }, 9, 1.73],
  ["HPG", { vi: "Hòa Phát", en: "Hoa Phat" }, 8, 1.65],
  ["GAS", { vi: "PV Gas", en: "PV Gas" }, 8, 0.96],
  ["FPT", { vi: "FPT", en: "FPT" }, 8, 1.18],
  ["MWG", { vi: "Thế Giới Di Động", en: "Mobile World" }, 7, 0.84],
  ["ACB", { vi: "ACB", en: "ACB" }, 7, 0.72],
  ["TCB", { vi: "Techcombank", en: "Techcombank" }, 7, 0.58],
  ["MBB", { vi: "MB Bank", en: "MB Bank" }, 6, 0.44],
  ["LPB", { vi: "LienVietPostBank", en: "LienVietPostBank" }, 6, 0.32],
  ["SSB", { vi: "SeABank", en: "SeABank" }, 6, 0.28],
  ["MSN", { vi: "Masan", en: "Masan" }, 6, 0.18],
  ["VNM", { vi: "Vinamilk", en: "Vinamilk" }, 5, 0.12],
  ["PLX", { vi: "Petrolimex", en: "Petrolimex" }, 5, -0.08],
  ["GVR", { vi: "Cao su Việt Nam", en: "Vietnam Rubber" }, 5, -0.14],
  ["SAB", { vi: "Sabeco", en: "Sabeco" }, 5, -0.22],
  ["PNJ", { vi: "PNJ", en: "PNJ" }, 4, -0.34],
  ["GMD", { vi: "Gemadept", en: "Gemadept" }, 4, -0.48],
  ["STB", { vi: "Sacombank", en: "Sacombank" }, 4, -0.56],
  ["VRE", { vi: "Vincom Retail", en: "Vincom Retail" }, 4, -0.68],
  ["VJC", { vi: "Vietjet", en: "Vietjet" }, 4, -0.82],
  ["KDH", { vi: "Khang Điền", en: "Khang Dien" }, 4, -0.94],
  ["VIB", { vi: "VIB", en: "VIB" }, 4, -1.02],
  ["BVH", { vi: "Bảo Việt", en: "Bao Viet" }, 3, -1.08],
  ["SSI", { vi: "SSI", en: "SSI" }, 3, -1.12],
  ["HDB", { vi: "HDBank", en: "HDBank" }, 3, -1.16],
  ["VND", { vi: "VNDIRECT", en: "VNDIRECT" }, 3, -1.18],
  ["VPB", { vi: "VPBank", en: "VPBank" }, 3, -1.20],
  ["POW", { vi: "PV Power", en: "PV Power" }, 3, -1.21],
  ["BCM", { vi: "Becamex", en: "Becamex" }, 3, -1.22],
  ["DXG", { vi: "Đất Xanh", en: "Dat Xanh" }, 3, -1.22],
  ["NVL", { vi: "Novaland", en: "Novaland" }, 3, -1.23],
  ["PDR", { vi: "Phát Đạt", en: "Phat Dat" }, 3, -1.35],
]

const hoseTiles = hoseSymbols.map(([s, n, w, pct]) => heatTile(s, n, w, pct))

const hnxTiles: HeatmapTile[] = [
  heatTile("SHB", { vi: "SHB", en: "SHB" }, 9, 1.24),
  heatTile("PVS", { vi: "PVS", en: "PVS" }, 8, 0.86),
  heatTile("CEO", { vi: "CEO Group", en: "CEO Group" }, 7, -0.42),
  heatTile("VCS", { vi: "Vicostone", en: "Vicostone" }, 7, 0.64),
  heatTile("TNG", { vi: "Thành Thành", en: "Thanh Thanh" }, 6, -0.28),
  heatTile("PVC", { vi: "PVC", en: "PVC" }, 6, 0.18),
  heatTile("VGC", { vi: "Viglacera", en: "Viglacera" }, 5, -0.52),
  heatTile("SHS", { vi: "SHS", en: "SHS" }, 5, 0.34),
  heatTile("VIG", { vi: "VIG", en: "VIG" }, 4, -0.18),
  heatTile("DDG", { vi: "DDG", en: "DDG" }, 4, 0.12),
  heatTile("NBC", { vi: "NBC", en: "NBC" }, 4, -0.64),
  heatTile("LAS", { vi: "LAS", en: "LAS" }, 3, -0.82),
]

const upcomTiles: HeatmapTile[] = [
  heatTile("VGT", { vi: "Vinatex", en: "Vinatex" }, 8, 0.92),
  heatTile("VE4", { vi: "VE4", en: "VE4" }, 7, 0.48),
  heatTile("QST", { vi: "QST", en: "QST" }, 6, -0.24),
  heatTile("ART", { vi: "ART", en: "ART" }, 6, 0.36),
  heatTile("VLA", { vi: "VLA", en: "VLA" }, 5, -0.44),
  heatTile("HVT", { vi: "HVT", en: "HVT" }, 5, 0.22),
  heatTile("LAI", { vi: "LAI", en: "LAI" }, 4, -0.58),
  heatTile("SJF", { vi: "SJF", en: "SJF" }, 4, 0.14),
  heatTile("VCR", { vi: "VCR", en: "VCR" }, 4, -0.32),
  heatTile("BRS", { vi: "BRS", en: "BRS" }, 3, -0.68),
]

const derivativesTiles: HeatmapTile[] = [
  heatTile("VN30F1M", { vi: "HĐTL VN30 T1", en: "VN30 Futures T1" }, 12, 1.42),
  heatTile("VN30F2M", { vi: "HĐTL VN30 T2", en: "VN30 Futures T2" }, 10, 0.86),
  heatTile("GB10F1M", { vi: "HĐTL GB10 T1", en: "GB10 Futures T1" }, 9, -0.24),
  heatTile("GB10F2M", { vi: "HĐTL GB10 T2", en: "GB10 Futures T2" }, 8, -0.48),
  heatTile("VN30F1Q", { vi: "HĐTL VN30 Q1", en: "VN30 Futures Q1" }, 7, 1.12),
  heatTile("VN30F2Q", { vi: "HĐTL VN30 Q2", en: "VN30 Futures Q2" }, 6, 0.64),
]

export function getMockData(): HeatmapData {
  return {
    markets: [
      {
        id: "vn",
        labelKey: "tab.vnMarket",
        flag: "🇻🇳",
        exchanges: [
          { id: "hose", labelKey: "tab.hose", tiles: hoseTiles },
          { id: "hnx", labelKey: "tab.hnx", tiles: hnxTiles },
          { id: "upcom", labelKey: "tab.upcom", tiles: upcomTiles },
          { id: "derivatives", labelKey: "tab.derivatives", tiles: derivativesTiles },
        ],
      },
      {
        id: "us",
        labelKey: "tab.usMarket",
        flag: "🇺🇸",
        tiles: [
          heatTile("AAPL", { vi: "Apple", en: "Apple" }, 12, 1.24),
          heatTile("MSFT", { vi: "Microsoft", en: "Microsoft" }, 11, 0.82),
          heatTile("NVDA", { vi: "NVIDIA", en: "NVIDIA" }, 10, 3.41),
          heatTile("AMZN", { vi: "Amazon", en: "Amazon" }, 9, -0.64),
          heatTile("GOOGL", { vi: "Alphabet", en: "Alphabet" }, 8, 0.45),
          heatTile("META", { vi: "Meta", en: "Meta" }, 7, -1.12),
          heatTile("TSLA", { vi: "Tesla", en: "Tesla" }, 7, -2.34),
          heatTile("BRK.B", { vi: "Berkshire", en: "Berkshire" }, 6, 0.21),
          heatTile("JPM", { vi: "JPMorgan", en: "JPMorgan" }, 6, 0.93),
          heatTile("V", { vi: "Visa", en: "Visa" }, 5, -0.28),
          heatTile("XOM", { vi: "Exxon", en: "Exxon" }, 5, 1.67),
          heatTile("UNH", { vi: "UnitedHealth", en: "UnitedHealth" }, 5, -0.74),
          heatTile("JNJ", { vi: "J&J", en: "J&J" }, 4, 0.12),
          heatTile("WMT", { vi: "Walmart", en: "Walmart" }, 4, 0.58),
          heatTile("MA", { vi: "Mastercard", en: "Mastercard" }, 4, -0.41),
          heatTile("PG", { vi: "P&G", en: "P&G" }, 3, 0.22),
          heatTile("HD", { vi: "Home Depot", en: "Home Depot" }, 3, 0.18),
          heatTile("CVX", { vi: "Chevron", en: "Chevron" }, 3, -0.34),
        ],
      },
      {
        id: "crypto",
        labelKey: "tab.cryptoMarket",
        flag: "₿",
        tiles: [
          heatTile("BTC", { vi: "Bitcoin", en: "Bitcoin" }, 14, 2.12),
          heatTile("ETH", { vi: "Ethereum", en: "Ethereum" }, 11, -1.17),
          heatTile("BNB", { vi: "BNB", en: "BNB" }, 8, 0.84),
          heatTile("SOL", { vi: "Solana", en: "Solana" }, 7, 4.62),
          heatTile("XRP", { vi: "XRP", en: "XRP" }, 6, -0.74),
          heatTile("ADA", { vi: "Cardano", en: "Cardano" }, 5, 1.28),
          heatTile("DOGE", { vi: "Dogecoin", en: "Dogecoin" }, 5, -2.05),
          heatTile("AVAX", { vi: "Avalanche", en: "Avalanche" }, 4, 3.11),
          heatTile("LINK", { vi: "Chainlink", en: "Chainlink" }, 4, 0.46),
          heatTile("DOT", { vi: "Polkadot", en: "Polkadot" }, 4, -1.62),
          heatTile("MATIC", { vi: "Polygon", en: "Polygon" }, 3, 2.74),
          heatTile("TON", { vi: "Toncoin", en: "Toncoin" }, 3, 5.21),
          heatTile("SHIB", { vi: "Shiba Inu", en: "Shiba Inu" }, 3, -1.42),
          heatTile("LTC", { vi: "Litecoin", en: "Litecoin" }, 3, 0.86),
        ],
      },
    ],
  }
}

export function getData(): HeatmapData {
  return getMockData()
}
