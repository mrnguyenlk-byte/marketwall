import type { Bi } from "@/lib/market-utils"
import {
  HOSE_SEEDS,
  HNX_SEEDS,
  UPCOM_SEEDS,
  type VietnamHeatmapStockSeed,
} from "@/lib/vietnam-heatmap-seeds"
import type { SymbolDetailRecord } from "@/lib/symbol-detail"

const EXCHANGE_LABELS: Record<string, string> = {
  hose: "HOSE",
  hnx: "HNX",
  upcom: "UPCOM",
}

function seedToRecord(
  seed: VietnamHeatmapStockSeed,
  exchangeId: string,
): SymbolDetailRecord {
  return {
    slug: seed.symbol.toLowerCase(),
    symbol: seed.symbol,
    name: seed.name,
    category: "equity",
    exchange: EXCHANGE_LABELS[exchangeId] ?? exchangeId.toUpperCase(),
    sector: seed.sector,
    region: { vi: "Việt Nam", en: "Vietnam" },
    mockPrice: seed.price,
    mockChangePercent: seed.changePercent,
  }
}

/** Client-safe Vietnam heatmap symbol registry (no market provider imports). */
export function buildHeatmapSymbolRecords(): SymbolDetailRecord[] {
  const records: SymbolDetailRecord[] = []

  for (const seed of HOSE_SEEDS) records.push(seedToRecord(seed, "hose"))
  for (const seed of HNX_SEEDS) records.push(seedToRecord(seed, "hnx"))
  for (const seed of UPCOM_SEEDS) records.push(seedToRecord(seed, "upcom"))

  return records
}
