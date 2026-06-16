import {
  HOSE_SEEDS,
  HNX_SEEDS,
  UPCOM_SEEDS,
} from "@/lib/vietnam-heatmap-seeds"

const SECTOR_BY_SYMBOL = new Map<string, string>()

for (const seed of [...HOSE_SEEDS, ...HNX_SEEDS, ...UPCOM_SEEDS]) {
  SECTOR_BY_SYMBOL.set(seed.symbol.toUpperCase(), seed.sector)
}

export function sectorForSymbol(symbol: string): string {
  return SECTOR_BY_SYMBOL.get(symbol.toUpperCase()) ?? "Other"
}
