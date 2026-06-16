import type { Bi } from "@/lib/market-utils"

type VietnamHeatmapStockSeed = {
  symbol: string
  name: Bi
  sector: string
  marketCap: number
  price: number
  changePercent: number
  volume: number
}

/** Sprint 30 — expand VN universe toward 200 symbols (sector leaders). */

export const HOSE_EXTENSION_SEEDS: VietnamHeatmapStockSeed[] = [
  { symbol: "HDG", name: { vi: "Hà Đô Group", en: "Ha Do Group" }, sector: "Real Estate", marketCap: 17500, price: 28.4, changePercent: 0.42, volume: 3200000 },
  { symbol: "NVB", name: { vi: "NCB", en: "NCB" }, sector: "Banking", marketCap: 16800, price: 18.2, changePercent: 0.28, volume: 4100000 },
  { symbol: "ABB", name: { vi: "ABBank", en: "ABBank" }, sector: "Banking", marketCap: 15200, price: 12.6, changePercent: 0.18, volume: 5200000 },
  { symbol: "PGB", name: { vi: "PG Bank", en: "PG Bank" }, sector: "Banking", marketCap: 14800, price: 14.8, changePercent: 0.22, volume: 3800000 },
  { symbol: "KLB", name: { vi: "Kienlongbank", en: "Kienlongbank" }, sector: "Banking", marketCap: 13200, price: 16.4, changePercent: 0.14, volume: 2900000 },
  { symbol: "BVB", name: { vi: "Bao Viet Bank", en: "Bao Viet Bank" }, sector: "Banking", marketCap: 12600, price: 22.8, changePercent: -0.08, volume: 2100000 },
  { symbol: "VAB", name: { vi: "VietABank", en: "VietABank" }, sector: "Banking", marketCap: 11800, price: 11.2, changePercent: 0.32, volume: 4600000 },
  { symbol: "IJC", name: { vi: "Imex Pan Pacific", en: "Imex Pan Pacific" }, sector: "Real Estate", marketCap: 11200, price: 14.6, changePercent: 0.48, volume: 5100000 },
  { symbol: "ITA", name: { vi: "Tân Tạo", en: "Tan Tao" }, sector: "Real Estate", marketCap: 10800, price: 2.4, changePercent: -0.62, volume: 18000000 },
  { symbol: "HQC", name: { vi: "Hoàng Quân", en: "Hoang Quan" }, sector: "Real Estate", marketCap: 10200, price: 3.8, changePercent: 0.36, volume: 9200000 },
  { symbol: "NBB", name: { vi: "577", en: "577" }, sector: "Real Estate", marketCap: 9800, price: 18.4, changePercent: 0.24, volume: 1800000 },
  { symbol: "TAL", name: { vi: "Taseco Land", en: "Taseco Land" }, sector: "Real Estate", marketCap: 9400, price: 42.6, changePercent: 0.52, volume: 680000 },
  { symbol: "DRH", name: { vi: "DRH Holdings", en: "DRH Holdings" }, sector: "Real Estate", marketCap: 9000, price: 4.2, changePercent: -0.28, volume: 11000000 },
  { symbol: "SAS", name: { vi: "Sasco", en: "Sasco" }, sector: "Real Estate", marketCap: 8600, price: 32.8, changePercent: 0.16, volume: 920000 },
  { symbol: "ORS", name: { vi: "Tiên Phong Securities", en: "Tien Phong Securities" }, sector: "Securities", marketCap: 8400, price: 18.6, changePercent: 0.44, volume: 3400000 },
  { symbol: "VDS", name: { vi: "VDS", en: "VDS" }, sector: "Securities", marketCap: 8200, price: 12.4, changePercent: 0.38, volume: 4100000 },
  { symbol: "SBS", name: { vi: "Saigon Bank Securities", en: "Saigon Bank Securities" }, sector: "Securities", marketCap: 8000, price: 8.6, changePercent: 0.28, volume: 5600000 },
  { symbol: "IVS", name: { vi: "IVS", en: "IVS" }, sector: "Securities", marketCap: 7800, price: 6.4, changePercent: -0.12, volume: 7200000 },
  { symbol: "TVS", name: { vi: "Thien Viet Securities", en: "Thien Viet Securities" }, sector: "Securities", marketCap: 7600, price: 9.8, changePercent: 0.32, volume: 4800000 },
  { symbol: "CTS", name: { vi: "Vietinbank Securities", en: "Vietinbank Securities" }, sector: "Securities", marketCap: 7400, price: 22.4, changePercent: 0.48, volume: 2100000 },
  { symbol: "BSI", name: { vi: "BIDV Securities", en: "BIDV Securities" }, sector: "Securities", marketCap: 7200, price: 28.6, changePercent: 0.22, volume: 1600000 },
  { symbol: "DSC", name: { vi: "DSC Securities", en: "DSC Securities" }, sector: "Securities", marketCap: 7000, price: 14.2, changePercent: 0.18, volume: 3900000 },
  { symbol: "EVF", name: { vi: "EV Finance Securities", en: "EV Finance Securities" }, sector: "Securities", marketCap: 6800, price: 11.8, changePercent: 0.14, volume: 3200000 },
  { symbol: "PPC", name: { vi: "Pha Lai Thermal", en: "Pha Lai Thermal" }, sector: "Oil & Gas", marketCap: 6600, price: 12.8, changePercent: -0.18, volume: 2800000 },
  { symbol: "VCA", name: { vi: "Vinacafe", en: "Vinacafe" }, sector: "Consumer", marketCap: 6400, price: 18.4, changePercent: 0.26, volume: 1400000 },
  { symbol: "VIS", name: { vi: "Vietnam Industrial Securities", en: "Vietnam Industrial Securities" }, sector: "Securities", marketCap: 6200, price: 7.2, changePercent: 0.34, volume: 5100000 },
  { symbol: "PVG", name: { vi: "PV Gas South", en: "PV Gas South" }, sector: "Oil & Gas", marketCap: 6000, price: 16.2, changePercent: 0.12, volume: 2200000 },
  { symbol: "CRC", name: { vi: "Can Tho Construction", en: "Can Tho Construction" }, sector: "Construction", marketCap: 5800, price: 8.4, changePercent: -0.22, volume: 4600000 },
]

export const HNX_EXTENSION_SEEDS: VietnamHeatmapStockSeed[] = [
  { symbol: "NDN", name: { vi: "Đà Nẵng", en: "Da Nang" }, sector: "Real Estate", marketCap: 5400, price: 6.2, changePercent: 0.28, volume: 6800000 },
  { symbol: "DTD", name: { vi: "DTD", en: "DTD" }, sector: "Securities", marketCap: 5200, price: 5.4, changePercent: 0.16, volume: 7200000 },
  { symbol: "SLS", name: { vi: "SLS", en: "SLS" }, sector: "Securities", marketCap: 5000, price: 4.8, changePercent: -0.14, volume: 9100000 },
  { symbol: "THS", name: { vi: "Thaiholdings Securities", en: "Thaiholdings Securities" }, sector: "Securities", marketCap: 4800, price: 7.6, changePercent: 0.22, volume: 5400000 },
  { symbol: "VGS", name: { vi: "VGS", en: "VGS" }, sector: "Steel", marketCap: 4600, price: 9.2, changePercent: 0.48, volume: 4200000 },
  { symbol: "TIS", name: { vi: "TISCO", en: "TISCO" }, sector: "Steel", marketCap: 4400, price: 14.6, changePercent: 0.36, volume: 3100000 },
  { symbol: "PSE", name: { vi: "Petrosetco", en: "Petrosetco" }, sector: "Oil & Gas", marketCap: 4200, price: 11.4, changePercent: -0.08, volume: 2600000 },
  { symbol: "BMS", name: { vi: "BMS", en: "BMS" }, sector: "Securities", marketCap: 4000, price: 3.6, changePercent: 0.42, volume: 12000000 },
]

export const UPCOM_EXTENSION_SEEDS: VietnamHeatmapStockSeed[] = [
  { symbol: "VRC", name: { vi: "VRC", en: "VRC" }, sector: "Real Estate", marketCap: 3600, price: 6.8, changePercent: 0.18, volume: 5400000 },
  { symbol: "HHS", name: { vi: "Hoang Huy", en: "Hoang Huy" }, sector: "Real Estate", marketCap: 3400, price: 4.6, changePercent: 0.32, volume: 8700000 },
  { symbol: "VTP", name: { vi: "Viettel Post", en: "Viettel Post" }, sector: "Logistics", marketCap: 3200, price: 68.4, changePercent: 0.64, volume: 420000 },
  { symbol: "PTB", name: { vi: "PTB", en: "PTB" }, sector: "Banking", marketCap: 3000, price: 8.2, changePercent: 0.12, volume: 3900000 },
  { symbol: "VHG", name: { vi: "VHG", en: "VHG" }, sector: "Real Estate", marketCap: 2800, price: 3.4, changePercent: -0.24, volume: 10200000 },
  { symbol: "HAC", name: { vi: "HAC", en: "HAC" }, sector: "Securities", marketCap: 2600, price: 5.8, changePercent: 0.28, volume: 6100000 },
  { symbol: "CNG", name: { vi: "CNG Vietnam", en: "CNG Vietnam" }, sector: "Oil & Gas", marketCap: 2400, price: 9.6, changePercent: 0.14, volume: 2800000 },
  { symbol: "VSA", name: { vi: "VSA", en: "VSA" }, sector: "Securities", marketCap: 2200, price: 4.2, changePercent: 0.08, volume: 7800000 },
]
