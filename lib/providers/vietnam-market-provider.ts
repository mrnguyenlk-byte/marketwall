import { type Bi, toTrend, spark } from "@/lib/market-utils"
import {
  fetchVietnamMarketFromAdapters,
  normalizedStocksToHeatmapBuckets,
  normalizedToProviderIndices,
} from "@/lib/adapters/vietnam"
import { CACHE_KEYS } from "@/lib/providers/cache"
import { withFallback } from "@/lib/providers/fallback"
import type {
  HeatmapExchange,
  HeatmapMarket,
  HeatmapTile,
  VnExchangeId,
} from "@/lib/providers/heatmap-provider"
import { getMockData as getHeatmapMock } from "@/lib/providers/heatmap-provider"

export type VietnamMarketIndex = {
  symbol: string
  name: Bi
  exchange: string
  price: number
  change: number
  changePercent: number
  volume: number
  value: number
  updatedAt: string
  source: "mock" | "live"
}

export type VietnamHeatmapStock = {
  symbol: string
  name: Bi
  exchange: VnExchangeId
  sector: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  volume: number
  value: number
  weight: number
}

export type VietnamMarketData = {
  indices: VietnamMarketIndex[]
  heatmapStocks: {
    hose: VietnamHeatmapStock[]
    hnx: VietnamHeatmapStock[]
    upcom: VietnamHeatmapStock[]
  }
  heatmapMarket: HeatmapMarket
  source: "mock" | "live"
}

/** @deprecated Use VietnamMarketIndex */
export type VietnamIndex = {
  symbol: string
  price: number
  changePercent: number
  trend: ReturnType<typeof toTrend>
}

type StockSeed = {
  symbol: string
  name: Bi
  sector: string
  marketCap: number
  price: number
  changePercent: number
  volume: number
}

const MOCK_UPDATED_AT = "2026-06-15T09:00:00+07:00"

function pctChange(price: number, changePercent: number): number {
  return Number((price * (changePercent / 100)).toFixed(2))
}

function stockValue(price: number, volume: number): number {
  return Math.round(price * volume)
}

function weightFromMarketCap(marketCap: number, maxCap: number): number {
  const ratio = marketCap / maxCap
  if (ratio >= 0.92) return 12
  if (ratio >= 0.82) return 11
  if (ratio >= 0.72) return 10
  if (ratio >= 0.62) return 9
  if (ratio >= 0.52) return 8
  if (ratio >= 0.42) return 7
  if (ratio >= 0.32) return 6
  if (ratio >= 0.22) return 5
  if (ratio >= 0.14) return 4
  return 3
}

function buildStock(seed: StockSeed, exchange: VnExchangeId): VietnamHeatmapStock {
  const change = pctChange(seed.price, seed.changePercent)
  return {
    symbol: seed.symbol,
    name: seed.name,
    exchange,
    sector: seed.sector,
    price: seed.price,
    change,
    changePercent: seed.changePercent,
    marketCap: seed.marketCap,
    volume: seed.volume,
    value: stockValue(seed.price, seed.volume),
    weight: 0,
  }
}

function assignWeights(stocks: VietnamHeatmapStock[]): VietnamHeatmapStock[] {
  const maxCap = Math.max(...stocks.map((s) => s.marketCap), 1)
  return stocks.map((stock) => ({
    ...stock,
    weight: weightFromMarketCap(stock.marketCap, maxCap),
  }))
}

function stockToTile(stock: VietnamHeatmapStock): HeatmapTile {
  return {
    symbol: stock.symbol,
    name: stock.name,
    changePercent: stock.changePercent,
    weight: stock.weight,
    price: stock.price,
  }
}

function buildExchange(
  id: VnExchangeId,
  labelKey: string,
  stocks: VietnamHeatmapStock[],
): HeatmapExchange {
  return {
    id,
    labelKey,
    tiles: stocks.map(stockToTile),
  }
}

const HOSE_SEEDS: StockSeed[] = [
  { symbol: "VCB", name: { vi: "Vietcombank", en: "Vietcombank" }, sector: "Banking", marketCap: 420000, price: 92.5, changePercent: 2.34, volume: 4200000 },
  { symbol: "VIC", name: { vi: "Vingroup", en: "Vingroup" }, sector: "Real Estate", marketCap: 395000, price: 68.2, changePercent: 2.28, volume: 6800000 },
  { symbol: "VHM", name: { vi: "Vinhomes", en: "Vinhomes" }, sector: "Real Estate", marketCap: 360000, price: 54.8, changePercent: 2.15, volume: 5200000 },
  { symbol: "BID", name: { vi: "BIDV", en: "BIDV" }, sector: "Banking", marketCap: 310000, price: 48.6, changePercent: 1.82, volume: 3900000 },
  { symbol: "CTG", name: { vi: "VietinBank", en: "VietinBank" }, sector: "Banking", marketCap: 295000, price: 36.4, changePercent: 1.73, volume: 4500000 },
  { symbol: "HPG", name: { vi: "Hòa Phát", en: "Hoa Phat" }, sector: "Steel", marketCap: 270000, price: 28.9, changePercent: 1.65, volume: 8100000 },
  { symbol: "GAS", name: { vi: "PV Gas", en: "PV Gas" }, sector: "Energy", marketCap: 245000, price: 72.1, changePercent: 0.96, volume: 1200000 },
  { symbol: "FPT", name: { vi: "FPT", en: "FPT" }, sector: "Technology", marketCap: 230000, price: 118.5, changePercent: 1.18, volume: 2100000 },
  { symbol: "MWG", name: { vi: "Thế Giới Di Động", en: "Mobile World" }, sector: "Retail", marketCap: 210000, price: 62.3, changePercent: 0.84, volume: 2800000 },
  { symbol: "ACB", name: { vi: "ACB", en: "ACB" }, sector: "Banking", marketCap: 198000, price: 27.8, changePercent: 0.72, volume: 3600000 },
  { symbol: "TCB", name: { vi: "Techcombank", en: "Techcombank" }, sector: "Banking", marketCap: 185000, price: 34.2, changePercent: 0.58, volume: 3200000 },
  { symbol: "MBB", name: { vi: "MB Bank", en: "MB Bank" }, sector: "Banking", marketCap: 172000, price: 26.5, changePercent: 0.44, volume: 4100000 },
  { symbol: "LPB", name: { vi: "LienVietPostBank", en: "LienVietPostBank" }, sector: "Banking", marketCap: 158000, price: 42.1, changePercent: 0.32, volume: 1900000 },
  { symbol: "SSB", name: { vi: "SeABank", en: "SeABank" }, sector: "Banking", marketCap: 145000, price: 18.9, changePercent: 0.28, volume: 5500000 },
  { symbol: "MSN", name: { vi: "Masan", en: "Masan" }, sector: "Consumer", marketCap: 132000, price: 78.4, changePercent: 0.18, volume: 980000 },
  { symbol: "VNM", name: { vi: "Vinamilk", en: "Vinamilk" }, sector: "Consumer", marketCap: 125000, price: 62.7, changePercent: 0.12, volume: 1100000 },
  { symbol: "PLX", name: { vi: "Petrolimex", en: "Petrolimex" }, sector: "Energy", marketCap: 118000, price: 48.2, changePercent: -0.08, volume: 1400000 },
  { symbol: "GVR", name: { vi: "Cao su Việt Nam", en: "Vietnam Rubber" }, sector: "Materials", marketCap: 108000, price: 28.4, changePercent: -0.14, volume: 2200000 },
  { symbol: "SAB", name: { vi: "Sabeco", en: "Sabeco" }, sector: "Consumer", marketCap: 102000, price: 142.5, changePercent: -0.22, volume: 420000 },
  { symbol: "PNJ", name: { vi: "PNJ", en: "PNJ" }, sector: "Retail", marketCap: 96000, price: 88.3, changePercent: -0.34, volume: 680000 },
  { symbol: "GMD", name: { vi: "Gemadept", en: "Gemadept" }, sector: "Logistics", marketCap: 88000, price: 52.6, changePercent: -0.48, volume: 890000 },
  { symbol: "STB", name: { vi: "Sacombank", en: "Sacombank" }, sector: "Banking", marketCap: 82000, price: 24.1, changePercent: -0.56, volume: 3100000 },
  { symbol: "VRE", name: { vi: "Vincom Retail", en: "Vincom Retail" }, sector: "Retail", marketCap: 76000, price: 28.7, changePercent: -0.68, volume: 2400000 },
  { symbol: "VJC", name: { vi: "Vietjet", en: "Vietjet" }, sector: "Transport", marketCap: 72000, price: 98.4, changePercent: -0.82, volume: 760000 },
  { symbol: "KDH", name: { vi: "Khang Điền", en: "Khang Dien" }, sector: "Real Estate", marketCap: 68000, price: 32.5, changePercent: -0.94, volume: 1800000 },
  { symbol: "VIB", name: { vi: "VIB", en: "VIB" }, sector: "Banking", marketCap: 64000, price: 22.8, changePercent: -1.02, volume: 2700000 },
  { symbol: "BVH", name: { vi: "Bảo Việt", en: "Bao Viet" }, sector: "Insurance", marketCap: 60000, price: 58.2, changePercent: -1.08, volume: 520000 },
  { symbol: "SSI", name: { vi: "SSI", en: "SSI" }, sector: "Brokerage", marketCap: 56000, price: 32.4, changePercent: -1.12, volume: 3400000 },
  { symbol: "HDB", name: { vi: "HDBank", en: "HDBank" }, sector: "Banking", marketCap: 52000, price: 18.6, changePercent: -1.16, volume: 4100000 },
  { symbol: "VND", name: { vi: "VNDIRECT", en: "VNDIRECT" }, sector: "Brokerage", marketCap: 48000, price: 22.1, changePercent: -1.18, volume: 2900000 },
  { symbol: "VPB", name: { vi: "VPBank", en: "VPBank" }, sector: "Banking", marketCap: 45000, price: 19.4, changePercent: -1.2, volume: 3800000 },
  { symbol: "POW", name: { vi: "PV Power", en: "PV Power" }, sector: "Energy", marketCap: 42000, price: 14.8, changePercent: -1.21, volume: 6200000 },
  { symbol: "BCM", name: { vi: "Becamex", en: "Becamex" }, sector: "Real Estate", marketCap: 39000, price: 42.3, changePercent: -1.22, volume: 1100000 },
  { symbol: "DXG", name: { vi: "Đất Xanh", en: "Dat Xanh" }, sector: "Real Estate", marketCap: 36000, price: 18.2, changePercent: -1.22, volume: 4500000 },
  { symbol: "NVL", name: { vi: "Novaland", en: "Novaland" }, sector: "Real Estate", marketCap: 34000, price: 12.6, changePercent: -1.23, volume: 7200000 },
  { symbol: "PDR", name: { vi: "Phát Đạt", en: "Phat Dat" }, sector: "Real Estate", marketCap: 32000, price: 21.4, changePercent: -1.35, volume: 5100000 },
  { symbol: "REE", name: { vi: "REE", en: "REE" }, sector: "Industrial", marketCap: 30000, price: 68.5, changePercent: 0.46, volume: 680000 },
  { symbol: "TPB", name: { vi: "TPBank", en: "TPBank" }, sector: "Banking", marketCap: 28000, price: 16.2, changePercent: 0.38, volume: 3900000 },
  { symbol: "FRT", name: { vi: "FPT Retail", en: "FPT Retail" }, sector: "Retail", marketCap: 26000, price: 48.7, changePercent: 0.52, volume: 920000 },
  { symbol: "CMG", name: { vi: "CMC", en: "CMC" }, sector: "Technology", marketCap: 24000, price: 42.8, changePercent: -0.28, volume: 780000 },
  { symbol: "DGC", name: { vi: "Đức Giang", en: "Duc Giang" }, sector: "Chemicals", marketCap: 22000, price: 98.5, changePercent: 1.12, volume: 620000 },
  { symbol: "DPM", name: { vi: "Đạm Phú Mỹ", en: "Dam Phu My" }, sector: "Chemicals", marketCap: 21000, price: 38.2, changePercent: 0.86, volume: 1100000 },
  { symbol: "SBT", name: { vi: "Mía đường Thành Thành", en: "Thanh Thanh Sugar" }, sector: "Consumer", marketCap: 20000, price: 22.4, changePercent: -0.42, volume: 890000 },
  { symbol: "DHG", name: { vi: "DHG Pharma", en: "DHG Pharma" }, sector: "Healthcare", marketCap: 19000, price: 112.6, changePercent: 0.64, volume: 340000 },
  { symbol: "PAN", name: { vi: "PAN Group", en: "PAN Group" }, sector: "Agriculture", marketCap: 18000, price: 28.8, changePercent: 0.38, volume: 720000 },
  { symbol: "DIG", name: { vi: "DIC Corp", en: "DIC Corp" }, sector: "Construction", marketCap: 17000, price: 24.6, changePercent: -0.56, volume: 2100000 },
  { symbol: "NLG", name: { vi: "Nam Long", en: "Nam Long" }, sector: "Real Estate", marketCap: 16000, price: 32.1, changePercent: 0.72, volume: 980000 },
  { symbol: "KBC", name: { vi: "Kinh Bắc", en: "Kinh Bac" }, sector: "Industrial", marketCap: 15000, price: 26.4, changePercent: -0.18, volume: 1500000 },
  { symbol: "VCI", name: { vi: "Vietcap", en: "Vietcap" }, sector: "Brokerage", marketCap: 14000, price: 44.2, changePercent: 0.92, volume: 560000 },
  { symbol: "MSR", name: { vi: "Maserco", en: "Maserco" }, sector: "Industrial", marketCap: 13000, price: 18.6, changePercent: -0.34, volume: 2300000 },
]

const HNX_SEEDS: StockSeed[] = [
  { symbol: "SHB", name: { vi: "SHB", en: "SHB" }, sector: "Banking", marketCap: 52000, price: 12.4, changePercent: 1.24, volume: 8200000 },
  { symbol: "PVS", name: { vi: "PVS", en: "PVS" }, sector: "Energy", marketCap: 48000, price: 28.6, changePercent: 0.86, volume: 2100000 },
  { symbol: "CEO", name: { vi: "CEO Group", en: "CEO Group" }, sector: "Real Estate", marketCap: 44000, price: 18.2, changePercent: -0.42, volume: 3600000 },
  { symbol: "VCS", name: { vi: "Vicostone", en: "Vicostone" }, sector: "Materials", marketCap: 40000, price: 52.8, changePercent: 0.64, volume: 680000 },
  { symbol: "TNG", name: { vi: "Thành Thành", en: "Thanh Thanh" }, sector: "Textile", marketCap: 36000, price: 14.5, changePercent: -0.28, volume: 2900000 },
  { symbol: "PVC", name: { vi: "PVC", en: "PVC" }, sector: "Construction", marketCap: 32000, price: 9.8, changePercent: 0.18, volume: 5100000 },
  { symbol: "VGC", name: { vi: "Viglacera", en: "Viglacera" }, sector: "Materials", marketCap: 30000, price: 42.1, changePercent: -0.52, volume: 1200000 },
  { symbol: "SHS", name: { vi: "SHS", en: "SHS" }, sector: "Brokerage", marketCap: 28000, price: 16.8, changePercent: 0.34, volume: 4100000 },
  { symbol: "VIG", name: { vi: "VIG", en: "VIG" }, sector: "Brokerage", marketCap: 26000, price: 8.6, changePercent: -0.18, volume: 6200000 },
  { symbol: "DDG", name: { vi: "DDG", en: "DDG" }, sector: "Construction", marketCap: 24000, price: 11.2, changePercent: 0.12, volume: 2800000 },
  { symbol: "NBC", name: { vi: "NBC", en: "NBC" }, sector: "Materials", marketCap: 22000, price: 22.4, changePercent: -0.64, volume: 1900000 },
  { symbol: "LAS", name: { vi: "LAS", en: "LAS" }, sector: "Agriculture", marketCap: 20000, price: 6.4, changePercent: -0.82, volume: 7400000 },
  { symbol: "VC3", name: { vi: "VC3", en: "VC3" }, sector: "Construction", marketCap: 18000, price: 14.2, changePercent: 0.22, volume: 2100000 },
  { symbol: "NTP", name: { vi: "NTP", en: "NTP" }, sector: "Construction", marketCap: 16500, price: 38.5, changePercent: -0.36, volume: 890000 },
  { symbol: "IDC", name: { vi: "IDC", en: "IDC" }, sector: "Industrial", marketCap: 15000, price: 32.8, changePercent: 0.48, volume: 760000 },
  { symbol: "HUT", name: { vi: "HUT", en: "HUT" }, sector: "Construction", marketCap: 14000, price: 8.2, changePercent: -0.14, volume: 4800000 },
  { symbol: "TIG", name: { vi: "TIG", en: "TIG" }, sector: "Real Estate", marketCap: 13000, price: 5.6, changePercent: 0.62, volume: 9200000 },
  { symbol: "PVI", name: { vi: "PVI", en: "PVI" }, sector: "Insurance", marketCap: 12000, price: 48.4, changePercent: -0.24, volume: 420000 },
  { symbol: "SCR", name: { vi: "SCR", en: "SCR" }, sector: "Real Estate", marketCap: 11000, price: 7.8, changePercent: 0.16, volume: 5600000 },
  { symbol: "VPH", name: { vi: "VPH", en: "VPH" }, sector: "Real Estate", marketCap: 10000, price: 4.2, changePercent: -0.48, volume: 8100000 },
  { symbol: "APS", name: { vi: "APS", en: "APS" }, sector: "Brokerage", marketCap: 9500, price: 6.8, changePercent: 0.28, volume: 3900000 },
  { symbol: "PET", name: { vi: "PET", en: "PET" }, sector: "Energy", marketCap: 9000, price: 18.4, changePercent: -0.32, volume: 1600000 },
  { symbol: "SHN", name: { vi: "SHN", en: "SHN" }, sector: "Real Estate", marketCap: 8500, price: 3.2, changePercent: 0.44, volume: 12000000 },
  { symbol: "TVB", name: { vi: "TVB", en: "TVB" }, sector: "Banking", marketCap: 8000, price: 9.6, changePercent: -0.56, volume: 3400000 },
  { symbol: "BVS", name: { vi: "BVS", en: "BVS" }, sector: "Brokerage", marketCap: 7500, price: 12.1, changePercent: 0.38, volume: 2700000 },
  { symbol: "VNR", name: { vi: "Vinaconex", en: "Vinaconex" }, sector: "Construction", marketCap: 7200, price: 14.8, changePercent: -0.22, volume: 3200000 },
  { symbol: "THD", name: { vi: "Thaiholdings", en: "Thaiholdings" }, sector: "Real Estate", marketCap: 6800, price: 9.2, changePercent: 0.48, volume: 4100000 },
  { symbol: "EID", name: { vi: "Hải Dương", en: "Hai Duong" }, sector: "Construction", marketCap: 6400, price: 11.6, changePercent: -0.36, volume: 2800000 },
  { symbol: "VTX", name: { vi: "VTX", en: "VTX" }, sector: "Technology", marketCap: 6000, price: 7.4, changePercent: 0.28, volume: 5200000 },
  { symbol: "PVB", name: { vi: "PV Oil", en: "PV Oil" }, sector: "Energy", marketCap: 5600, price: 28.2, changePercent: -0.14, volume: 980000 },
]

const UPCOM_SEEDS: StockSeed[] = [
  { symbol: "VGT", name: { vi: "Vinatex", en: "Vinatex" }, sector: "Textile", marketCap: 18000, price: 14.2, changePercent: 0.92, volume: 3200000 },
  { symbol: "VE4", name: { vi: "VE4", en: "VE4" }, sector: "Construction", marketCap: 16500, price: 8.4, changePercent: 0.48, volume: 4100000 },
  { symbol: "QST", name: { vi: "QST", en: "QST" }, sector: "Industrial", marketCap: 15000, price: 6.2, changePercent: -0.24, volume: 5800000 },
  { symbol: "ART", name: { vi: "ART", en: "ART" }, sector: "Consumer", marketCap: 14000, price: 12.8, changePercent: 0.36, volume: 2100000 },
  { symbol: "VLA", name: { vi: "VLA", en: "VLA" }, sector: "Agriculture", marketCap: 13000, price: 5.4, changePercent: -0.44, volume: 7200000 },
  { symbol: "HVT", name: { vi: "HVT", en: "HVT" }, sector: "Transport", marketCap: 12000, price: 9.6, changePercent: 0.22, volume: 3600000 },
  { symbol: "LAI", name: { vi: "LAI", en: "LAI" }, sector: "Agriculture", marketCap: 11000, price: 4.8, changePercent: -0.58, volume: 9100000 },
  { symbol: "SJF", name: { vi: "SJF", en: "SJF" }, sector: "Industrial", marketCap: 10000, price: 7.2, changePercent: 0.14, volume: 2800000 },
  { symbol: "VCR", name: { vi: "VCR", en: "VCR" }, sector: "Real Estate", marketCap: 9500, price: 11.4, changePercent: -0.32, volume: 1900000 },
  { symbol: "BRS", name: { vi: "BRS", en: "BRS" }, sector: "Energy", marketCap: 9000, price: 6.8, changePercent: -0.68, volume: 5400000 },
  { symbol: "VTL", name: { vi: "VTL", en: "VTL" }, sector: "Consumer", marketCap: 8500, price: 18.6, changePercent: 0.26, volume: 820000 },
  { symbol: "TPP", name: { vi: "TPP", en: "TPP" }, sector: "Industrial", marketCap: 8000, price: 5.2, changePercent: -0.18, volume: 4600000 },
  { symbol: "CMR", name: { vi: "CMR", en: "CMR" }, sector: "Agriculture", marketCap: 7500, price: 3.6, changePercent: 0.42, volume: 11000000 },
  { symbol: "MCH", name: { vi: "MCH", en: "MCH" }, sector: "Consumer", marketCap: 7000, price: 22.4, changePercent: -0.12, volume: 680000 },
  { symbol: "VEF", name: { vi: "VEF", en: "VEF" }, sector: "Real Estate", marketCap: 6500, price: 4.4, changePercent: 0.54, volume: 8700000 },
  { symbol: "HAI", name: { vi: "HAI", en: "HAI" }, sector: "Agriculture", marketCap: 6000, price: 2.8, changePercent: -0.46, volume: 14000000 },
  { symbol: "ABT", name: { vi: "ABT", en: "ABT" }, sector: "Consumer", marketCap: 5500, price: 38.2, changePercent: 0.18, volume: 420000 },
  { symbol: "BPC", name: { vi: "BPC", en: "BPC" }, sector: "Energy", marketCap: 5000, price: 8.6, changePercent: -0.28, volume: 3200000 },
  { symbol: "TVG", name: { vi: "TVG", en: "TVG" }, sector: "Textile", marketCap: 4800, price: 6.4, changePercent: 0.32, volume: 4100000 },
  { symbol: "VMC", name: { vi: "VMC", en: "VMC" }, sector: "Industrial", marketCap: 4500, price: 4.2, changePercent: -0.62, volume: 9800000 },
  { symbol: "DNP", name: { vi: "DNP", en: "DNP" }, sector: "Packaging", marketCap: 4200, price: 12.6, changePercent: 0.24, volume: 1500000 },
  { symbol: "VGP", name: { vi: "VGP", en: "VGP" }, sector: "Consumer", marketCap: 4000, price: 9.8, changePercent: -0.34, volume: 2600000 },
  { symbol: "LGL", name: { vi: "LGL", en: "LGL" }, sector: "Real Estate", marketCap: 3800, price: 3.2, changePercent: 0.48, volume: 12500000 },
  { symbol: "VNC", name: { vi: "VNC", en: "VNC" }, sector: "Transport", marketCap: 3600, price: 7.4, changePercent: -0.22, volume: 3400000 },
  { symbol: "VTS", name: { vi: "VTS", en: "VTS" }, sector: "Industrial", marketCap: 3400, price: 5.8, changePercent: 0.16, volume: 5200000 },
  { symbol: "APC", name: { vi: "APC", en: "APC" }, sector: "Industrial", marketCap: 3200, price: 4.6, changePercent: 0.52, volume: 6800000 },
  { symbol: "BBS", name: { vi: "BBS", en: "BBS" }, sector: "Consumer", marketCap: 3000, price: 8.2, changePercent: -0.28, volume: 3900000 },
  { symbol: "DRL", name: { vi: "DRL", en: "DRL" }, sector: "Energy", marketCap: 2800, price: 6.4, changePercent: 0.34, volume: 4500000 },
  { symbol: "HPW", name: { vi: "HPW", en: "HPW" }, sector: "Utilities", marketCap: 2600, price: 3.8, changePercent: -0.42, volume: 8200000 },
  { symbol: "LSS", name: { vi: "LSS", en: "LSS" }, sector: "Agriculture", marketCap: 2400, price: 5.2, changePercent: 0.18, volume: 6100000 },
]

function buildIndices(source: "mock" | "live"): VietnamMarketIndex[] {
  const defs: Omit<VietnamMarketIndex, "updatedAt" | "source">[] = [
    {
      symbol: "VNINDEX",
      name: { vi: "VN-Index", en: "VN-Index" },
      exchange: "HOSE",
      price: 1281.4,
      change: 6.8,
      changePercent: 0.53,
      volume: 485000000,
      value: 18240000,
    },
    {
      symbol: "VN30",
      name: { vi: "VN30", en: "VN30" },
      exchange: "HOSE",
      price: 1302.7,
      change: 7.2,
      changePercent: 0.56,
      volume: 312000000,
      value: 14280000,
    },
    {
      symbol: "VN10",
      name: { vi: "VN10", en: "VN10" },
      exchange: "HOSE",
      price: 1184.2,
      change: 2.4,
      changePercent: 0.2,
      volume: 98000000,
      value: 4680000,
    },
    {
      symbol: "HNX",
      name: { vi: "HNX-Index", en: "HNX-Index" },
      exchange: "HNX",
      price: 248.6,
      change: -1.2,
      changePercent: -0.48,
      volume: 42000000,
      value: 1240000,
    },
    {
      symbol: "UPCOM",
      name: { vi: "UPCoM-Index", en: "UPCoM-Index" },
      exchange: "UPCOM",
      price: 92.8,
      change: 0.6,
      changePercent: 0.65,
      volume: 18000000,
      value: 520000,
    },
  ]

  return defs.map((def) => ({
    ...def,
    updatedAt: MOCK_UPDATED_AT,
    source,
  }))
}

function buildHeatmapStocks(): VietnamMarketData["heatmapStocks"] {
  const hose = assignWeights(HOSE_SEEDS.map((seed) => buildStock(seed, "hose")))
  const hnx = assignWeights(HNX_SEEDS.map((seed) => buildStock(seed, "hnx")))
  const upcom = assignWeights(UPCOM_SEEDS.map((seed) => buildStock(seed, "upcom")))
  return { hose, hnx, upcom }
}

function getDerivativesExchange(): HeatmapExchange {
  const vnHeatmap = getHeatmapMock().markets.find((m) => m.id === "vn")
  const derivatives = vnHeatmap?.exchanges?.find((e) => e.id === "derivatives")
  return derivatives ?? {
    id: "derivatives",
    labelKey: "tab.derivatives",
    tiles: [],
  }
}

function buildHeatmapMarket(stocks: VietnamMarketData["heatmapStocks"]): HeatmapMarket {
  return {
    id: "vn",
    labelKey: "tab.vnMarket",
    flag: "🇻🇳",
    exchanges: [
      buildExchange("hose", "tab.hose", stocks.hose),
      buildExchange("hnx", "tab.hnx", stocks.hnx),
      buildExchange("upcom", "tab.upcom", stocks.upcom),
      getDerivativesExchange(),
    ],
  }
}

export function getMockData(): VietnamMarketData {
  const heatmapStocks = buildHeatmapStocks()
  return {
    indices: buildIndices("mock"),
    heatmapStocks,
    heatmapMarket: buildHeatmapMarket(heatmapStocks),
    source: "mock",
  }
}

/** Try Vietnam adapters (TCBS public API) then fall back to enriched mock data. */
async function fetchLiveVietnamMarketData(): Promise<VietnamMarketData | null> {
  if (process.env.VIETNAM_MARKET_ENABLED === "false") return null

  const result = await fetchVietnamMarketFromAdapters()
  if (result.status !== "ok") return null

  const mock = getMockData()
  const { data } = result

  const indices = normalizedToProviderIndices(
    data.indices.length ? data.indices : mock.indices.map((i) => ({
      symbol: i.symbol,
      name: i.name,
      exchange: i.exchange as "HOSE" | "HNX" | "UPCOM",
      price: i.price,
      change: i.change,
      changePercent: i.changePercent,
      volume: i.volume,
      value: i.value,
      updatedAt: i.updatedAt,
    })),
    "live",
  )

  const hasLiveStocks =
    data.stocks.hose.length + data.stocks.hnx.length + data.stocks.upcom.length > 0

  const heatmapStocks = hasLiveStocks
    ? normalizedStocksToHeatmapBuckets(data.stocks)
    : mock.heatmapStocks

  return {
    indices,
    heatmapStocks,
    heatmapMarket: buildHeatmapMarket(heatmapStocks),
    source: "live",
  }
}

export async function getData(): Promise<VietnamMarketData> {
  const resolved = await withFallback(
    fetchLiveVietnamMarketData,
    getMockData,
    { provider: "vietnam-markets", cacheKey: CACHE_KEYS.vietnamMarkets },
  )

  return resolved.data
}

export function vietnamSparkline(symbol: string, trend: ReturnType<typeof toTrend>): number[] {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return spark(seed, 14, trend === "up" ? 1 : -1)
}

/** Legacy adapter for build-dashboard-data quote overlays. */
export function toLegacyVietnamIndices(indices: VietnamMarketIndex[]): VietnamIndex[] {
  return indices.map((index) => ({
    symbol: index.symbol,
    price: index.price,
    changePercent: index.changePercent,
    trend: toTrend(index.changePercent),
  }))
}
