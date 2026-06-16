import type {
  VietnamProprietaryHistoryPoint,
  VietnamProprietaryNetRow,
} from "@/lib/vietnam/market-analytics"

export function valueToBillionVnd(valueVnd: number): number {
  return valueVnd / 1_000_000_000
}

export function formatProprietaryBillions(valueVnd: number): string {
  const b = valueToBillionVnd(valueVnd)
  if (Math.abs(b) >= 100) return `${b.toFixed(1)}B`
  if (Math.abs(b) >= 1) return `${b.toFixed(2)}B`
  return `${(b * 1000).toFixed(0)}M`
}

export function maxHistoryNetMagnitude(history: VietnamProprietaryHistoryPoint[]): number {
  if (!history.length) return 1
  return Math.max(...history.map((p) => Math.abs(valueToBillionVnd(p.netValue))), 0.01)
}

export function maxTopNetMagnitude(rows: VietnamProprietaryNetRow[]): number {
  if (!rows.length) return 1
  return Math.max(...rows.map((r) => Math.abs(valueToBillionVnd(r.netValue))), 0.01)
}

export function maxTopBuyMagnitude(rows: VietnamProprietaryNetRow[]): number {
  if (!rows.length) return 1
  return Math.max(...rows.map((r) => valueToBillionVnd(r.buyValue)), 0.01)
}

export function maxTopSellMagnitude(rows: VietnamProprietaryNetRow[]): number {
  if (!rows.length) return 1
  return Math.max(...rows.map((r) => valueToBillionVnd(r.sellValue)), 0.01)
}

export function formatHistoryLabel(date: string): string {
  const parts = date.split(/[-/]/)
  if (parts.length >= 3) {
    const dd = parts[0].length === 4 ? parts[2] : parts[0]
    const mm = parts[0].length === 4 ? parts[1] : parts[1]
    return `${dd}/${mm}`
  }
  return date
}
