import "server-only"

import {
  HOSE_SEEDS,
  HNX_SEEDS,
  UPCOM_SEEDS,
} from "@/lib/vietnam-heatmap-seeds"
import {
  fetchKbsIndexSnapshot,
  fetchKbsPriceBoard,
  parseKbsPriceBoardRow,
} from "@/lib/providers/kbs-client"
import type {
  AdapterFetchResult,
  NormalizedVietnamMarket,
  NormalizedVietnamStock,
  VietnamMarketAdapter,
} from "./types"
import { groupStocksByExchange, normalizeKbsIndex } from "./normalize"

const KBS_INDEX_TICKERS = ["VNINDEX", "VN30", "HNX", "UPCOM"] as const
const BATCH_SIZE = 25

export const KBS_ADAPTER_META = {
  id: "kbs" as const,
  name: "KBS / Vnstock",
  capabilities: ["stocks", "heatmap", "indices", "eod", "foreign_flow"] as const,
  baseUrl: "https://kbbuddywts.kbsec.com.vn",
  requiresAuth: false,
  notes: "Free KBS IIS endpoints (vnstock 4.x default). Secondary to VPS for heatmap.",
}

export function isKbsConfigured(): boolean {
  return process.env.KBS_ADAPTER_ENABLED !== "false"
}

function seedLookup() {
  const all = [...HOSE_SEEDS, ...HNX_SEEDS, ...UPCOM_SEEDS]
  return new Map(all.map((seed) => [seed.symbol.toUpperCase(), seed]))
}

function normalizeKbsStockRow(
  parsed: NonNullable<ReturnType<typeof parseKbsPriceBoardRow>>,
  seeds: ReturnType<typeof seedLookup>,
): NormalizedVietnamStock {
  const seed = seeds.get(parsed.symbol)
  return {
    symbol: parsed.symbol,
    name: seed?.name ?? { vi: parsed.symbol, en: parsed.symbol },
    exchange: parsed.exchange,
    sector: seed?.sector ?? "Equity",
    price: parsed.price,
    change: parsed.change,
    changePercent: parsed.changePercent,
    marketCap: seed?.marketCap ?? 0,
    volume: parsed.volume,
    value: parsed.value,
    updatedAt: new Date().toISOString(),
    foreignBuyVolume: parsed.foreignBuy,
    foreignSellVolume: parsed.foreignSell,
  }
}

async function fetchKbsStocks(): Promise<NormalizedVietnamStock[]> {
  const seeds = seedLookup()
  const symbols = [...seeds.keys()]
  const rows: NormalizedVietnamStock[] = []

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE)
    const board = await fetchKbsPriceBoard(batch)
    for (const raw of board) {
      const parsed = parseKbsPriceBoardRow(raw)
      if (!parsed) continue
      rows.push(normalizeKbsStockRow(parsed, seeds))
    }
  }

  return rows
}

async function fetchKbsIndices() {
  const results = await Promise.all(
    KBS_INDEX_TICKERS.map(async (symbol) => {
      const snap = await fetchKbsIndexSnapshot(symbol)
      if (!snap) return null
      return normalizeKbsIndex(symbol, snap)
    }),
  )
  return results.filter((row): row is NonNullable<typeof row> => row != null)
}

export const kbsAdapter: VietnamMarketAdapter = {
  meta: {
    ...KBS_ADAPTER_META,
    capabilities: [...KBS_ADAPTER_META.capabilities],
  },

  isConfigured() {
    return isKbsConfigured()
  },

  async fetchMarketSnapshot(): Promise<AdapterFetchResult<NormalizedVietnamMarket>> {
    if (!isKbsConfigured()) {
      return {
        status: "not_configured",
        provider: "kbs",
        reason: "KBS_ADAPTER_ENABLED is false",
      }
    }

    try {
      const [indices, stocks] = await Promise.all([fetchKbsIndices(), fetchKbsStocks()])

      if (!indices.length && !stocks.length) {
        return { status: "error", provider: "kbs", message: "KBS returned no market data" }
      }

      const fetchedAt = new Date().toISOString()
      return {
        status: "ok",
        provider: "kbs",
        fetchedAt,
        data: {
          provider: "kbs",
          indices,
          stocks: groupStocksByExchange(stocks),
          fetchedAt,
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "KBS fetch failed"
      return { status: "error", provider: "kbs", message }
    }
  },
}
