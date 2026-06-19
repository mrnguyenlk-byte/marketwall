import "server-only"

import { VIETNAM_ADAPTER_PRIORITY } from "@/lib/adapters/vietnam/registry"
import { isKbsConfigured } from "@/lib/adapters/vietnam/kbs-adapter"
import { isTcbsConfigured } from "@/lib/adapters/vietnam/tcbs-adapter"
import { isVpsConfigured } from "@/lib/adapters/vietnam/vps-adapter"
import { CACHE_KEYS, CACHE_TTL, DEFAULT_CACHE_TTL_MS, getCacheTiming } from "@/lib/providers/cache"
import { getData as getCryptoData } from "@/lib/providers/crypto-provider"
import { getData as getGlobalData } from "@/lib/providers/global-market-provider"
import { getData as getVietnamData } from "@/lib/providers/vietnam-market-provider"
import { loadProprietaryHeatmapOverlay } from "@/lib/proprietary/heatmap-overlay"
import { vietnamTodayIso } from "@/lib/proprietary/proprietary-status"
import type { VietnamHeatmapStock } from "@/lib/providers/vietnam-market-provider"
import type { DataHealthReport, DataHealthSection, SourceStatus } from "@/lib/data-health/types"

function flattenVnStocks(stocks: {
  hose: VietnamHeatmapStock[]
  hnx: VietnamHeatmapStock[]
  upcom: VietnamHeatmapStock[]
}): VietnamHeatmapStock[] {
  return [...stocks.hose, ...stocks.hnx, ...stocks.upcom]
}

function countLiveVnStocks(stocks: VietnamHeatmapStock[]): number {
  return stocks.filter((s) => s.price > 0).length
}

function cacheMeta(key: string): { cachedAt: string | null; expiresAt: string | null } {
  const timing = getCacheTiming(key)
  if (!timing) return { cachedAt: null, expiresAt: null }
  return {
    cachedAt: new Date(timing.cachedAt).toISOString(),
    expiresAt: new Date(timing.expiresAt).toISOString(),
  }
}

function vnAdapterReadiness(): string[] {
  const warnings: string[] = []
  const primary: Array<[string, boolean]> = [
    ["vps", isVpsConfigured()],
    ["kbs", isKbsConfigured()],
    ["tcbs", isTcbsConfigured()],
  ]
  for (const [id, ok] of primary) {
    if (!ok) warnings.push(`Primary adapter ${id} is disabled via env`)
  }
  return warnings
}

function resolveVnStatus(source: "live" | "mock", liveCount: number, total: number): SourceStatus {
  if (source !== "live") return "mock"
  if (liveCount === 0) return "unavailable"
  if (liveCount < total * 0.5) return "partial"
  return "live"
}

function buildVietnamSectionFromData(
  data: Awaited<ReturnType<typeof getVietnamData>>,
): DataHealthSection {
  const cacheTtlMs = CACHE_TTL.heatmap
  const warnings = vnAdapterReadiness()
  const cache = cacheMeta(CACHE_KEYS.vietnamMarkets)
  const all = flattenVnStocks(data.heatmapStocks)
  const liveCount = countLiveVnStocks(all)
  const exchangeCounts = {
    hose: data.heatmapStocks.hose.length,
    hnx: data.heatmapStocks.hnx.length,
    upcom: data.heatmapStocks.upcom.length,
  }

  if (data.source !== "live") {
    warnings.push("Vietnam market provider returned mock fallback data")
  }
  if (data.enrichmentProvider === "kbs") {
    warnings.push("KBS enriches leaderboards and indices when VPS data is sparse")
  }

  const provider = data.heatmapProvider ?? VIETNAM_ADAPTER_PRIORITY.join(" → ")

  return {
    provider,
    providers: [...VIETNAM_ADAPTER_PRIORITY],
    lastUpdatedAt: data.dashboard.updatedAt ?? cache.cachedAt,
    cacheTtlMs,
    itemCount: all.length,
    coverageCount: liveCount,
    sourceStatus: resolveVnStatus(data.source, liveCount, all.length),
    warnings,
    details: {
      exchanges: exchangeCounts,
      indices: data.indices.length,
      volumeUnit: data.volumeUnit,
      enrichmentProvider: data.enrichmentProvider ?? null,
      cacheExpiresAt: cache.expiresAt,
      liquidityAvailable: data.analytics.liquidity.available,
      totalTradingValue: data.analytics.liquidity.totalValue,
      totalVolume: data.analytics.liquidity.totalVolume,
    },
  }
}

function buildVietnamSectionUnavailable(error: unknown): DataHealthSection {
  const cacheTtlMs = CACHE_TTL.heatmap
  const warnings = vnAdapterReadiness()
  const cache = cacheMeta(CACHE_KEYS.vietnamMarkets)
  const message = error instanceof Error ? error.message : "vietnam probe failed"
  warnings.push(message)
  return {
    provider: VIETNAM_ADAPTER_PRIORITY.join(" → "),
    providers: [...VIETNAM_ADAPTER_PRIORITY],
    lastUpdatedAt: cache.cachedAt,
    cacheTtlMs,
    itemCount: 0,
    coverageCount: 0,
    sourceStatus: "unavailable",
    warnings,
    details: { cacheExpiresAt: cache.expiresAt },
  }
}

function buildForeignFlowSection(
  vn: Awaited<ReturnType<typeof getVietnamData>> | null,
): DataHealthSection {
  const cacheTtlMs = CACHE_TTL.heatmap
  const warnings: string[] = []

  if (!vn) {
    return {
      provider: "VPS (fBVol/fSVolume)",
      providers: ["vps", "kbs"],
      lastUpdatedAt: null,
      cacheTtlMs,
      itemCount: 0,
      coverageCount: 0,
      sourceStatus: "unavailable",
      warnings: ["Could not load Vietnam market data for foreign flow probe"],
    }
  }

  const ff = vn.analytics.foreignFlow
  const all = flattenVnStocks(vn.heatmapStocks)
  const symbolsWithForeign = all.filter(
    (s) => (s.foreignBuy ?? 0) > 0 || (s.foreignSell ?? 0) > 0,
  ).length

  if (!ff.available) warnings.push("No foreign flow volume detected in heatmap stocks")
  if (!ff.historicalAvailable) {
    warnings.push("7D/30D foreign flow views extrapolate daily VPS volumes — not true history")
  }
  warnings.push("Foreign values are derived: shares × price (not exchange-reported GTGD)")

  let sourceStatus: SourceStatus = "unavailable"
  if (ff.available && vn.source === "live") sourceStatus = "live"
  else if (ff.available) sourceStatus = "partial"
  else if (vn.source === "mock") sourceStatus = "mock"

  return {
    provider: vn.heatmapProvider === "kbs" ? "KBS" : "VPS (fBVol/fSVolume)",
    providers: ["vps", "kbs"],
    lastUpdatedAt: vn.dashboard.updatedAt,
    cacheTtlMs,
    itemCount: symbolsWithForeign,
    coverageCount: ff.topNetBuy.length + ff.topNetSell.length,
    sourceStatus,
    warnings,
    details: {
      aggregatedExchanges: ["HOSE", "HNX", "UPCOM"],
      range: ff.range,
      buyVolume: ff.buyVolume,
      sellVolume: ff.sellVolume,
      netVolume: ff.netVolume,
      buyValue: ff.buyValue,
      sellValue: ff.sellValue,
      netValue: ff.netValue,
      topNetBuyCount: ff.topNetBuy.length,
      topNetSellCount: ff.topNetSell.length,
      dataType: "real_intraday_volume_derived_value",
    },
  }
}

async function buildProprietaryFlowSection(): Promise<DataHealthSection> {
  const warnings: string[] = []
  const today = vietnamTodayIso()

  try {
    const { overlay, status } = await loadProprietaryHeatmapOverlay()
    const analytics = status.proprietarySource === "cafef-eod" ? "cafef-eod" : status.proprietarySource

    if (status.proprietarySource === "gtgd-proxy") {
      warnings.push("Proprietary data is stale — using prior-session CafeF rows as GTGD proxy")
    }
    if (overlay.size === 0) {
      warnings.push("No proprietary overlay — heatmap proprietary mode uses GTGD/trading-value proxy")
    }
    if (!process.env.DATABASE_URL?.trim()) {
      warnings.push("DATABASE_URL not set — ProprietaryTradingDaily unavailable; CafeF scrape only")
    }

    let sourceStatus: SourceStatus = "unavailable"
    if (status.proprietarySource === "cafef-eod" && !status.isStale) sourceStatus = "eod"
    else if (overlay.size > 0 && status.isStale) sourceStatus = "stale"
    else if (overlay.size > 0) sourceStatus = "partial"

    return {
      provider: analytics === "cafef-eod" ? "CafeF EOD (DB)" : "CafeF EOD / GTGD proxy",
      providers: ["cafef", "postgresql"],
      lastUpdatedAt: status.lastUpdatedAt,
      cacheTtlMs: 0,
      itemCount: overlay.size,
      coverageCount: status.coverageCount,
      sourceStatus,
      warnings,
      details: {
        proprietarySource: status.proprietarySource,
        isStale: status.isStale,
        sessionToday: today,
        syncCron: "30 10 * * 1-5 UTC (17:30 ICT weekdays)",
        syncEndpoint: "/api/sync/proprietary-eod",
        lookbackDays: 7,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "proprietary probe failed"
    warnings.push(message)
    return {
      provider: "CafeF",
      providers: ["cafef", "postgresql"],
      lastUpdatedAt: null,
      cacheTtlMs: 0,
      itemCount: 0,
      coverageCount: 0,
      sourceStatus: "unavailable",
      warnings,
    }
  }
}

async function buildUsSection(): Promise<DataHealthSection> {
  const cacheTtlMs = CACHE_TTL.heatmap
  const cache = cacheMeta(CACHE_KEYS.heatmapUs)
  const warnings: string[] = []

  try {
    const { fetchHeatmapMarket } = await import("@/lib/market/heatmap")
    const us = await fetchHeatmapMarket("us")

    if (us.source !== "live") {
      warnings.push("US heatmap below live price threshold — seed/mock padding applied")
    }
    if (us.livePriceCount < us.itemCount) {
      warnings.push(
        `Only ${us.livePriceCount}/${us.itemCount} US symbols have live Yahoo prices`,
      )
    }

    return {
      provider: "Yahoo Finance",
      providers: ["yahoo-v8-chart", "yahoo-v7-quote"],
      lastUpdatedAt: cache.cachedAt ?? new Date().toISOString(),
      cacheTtlMs,
      itemCount: us.itemCount,
      coverageCount: us.livePriceCount,
      sourceStatus: us.source === "live" ? "live" : us.livePriceCount > 0 ? "partial" : "mock",
      warnings,
      details: {
        seedCount: us.seedCount,
        cacheExpiresAt: cache.expiresAt,
        minLivePrices: 5,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "us probe failed"
    warnings.push(message)
    return {
      provider: "Yahoo Finance",
      lastUpdatedAt: cache.cachedAt,
      cacheTtlMs,
      itemCount: 0,
      coverageCount: 0,
      sourceStatus: "unavailable",
      warnings,
    }
  }
}

async function buildCryptoSection(): Promise<DataHealthSection> {
  const cacheTtlMs = CACHE_TTL.crypto
  const cache = cacheMeta(CACHE_KEYS.crypto)
  const warnings: string[] = []

  try {
    const data = await getCryptoData()
    const liveAssets = data.assets.filter((a) => a.price > 0).length

    if (data.source !== "live") {
      warnings.push("CoinGecko unavailable — mock crypto assets served")
    }

    return {
      provider: "CoinGecko",
      providers: ["coingecko"],
      lastUpdatedAt: cache.cachedAt ?? new Date().toISOString(),
      cacheTtlMs,
      itemCount: data.assets.length,
      coverageCount: liveAssets,
      sourceStatus: data.source === "live" ? "live" : "mock",
      warnings,
      details: {
        fearGreedProvider: "Alternative.me",
        cacheExpiresAt: cache.expiresAt,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "crypto probe failed"
    warnings.push(message)
    return {
      provider: "CoinGecko",
      lastUpdatedAt: cache.cachedAt,
      cacheTtlMs,
      itemCount: 0,
      coverageCount: 0,
      sourceStatus: "unavailable",
      warnings,
    }
  }
}

async function buildGlobalSection(): Promise<DataHealthSection> {
  const cacheTtlMs = DEFAULT_CACHE_TTL_MS
  const cache = cacheMeta(CACHE_KEYS.globalMarkets)
  const warnings: string[] = []

  try {
    const data = await getGlobalData()
    const liveQuotes = data.quotes.filter((q) => q.source === "live").length

    if (data.source !== "live") {
      warnings.push("Global macro quotes fell back to mock")
    }
    if (liveQuotes < data.quotes.length) {
      warnings.push("Some instruments (Gold, DXY, Oil, indices) may be mock-filled")
    }
    warnings.push("Stooq CSV is EOD/delayed when used as fallback")

    return {
      provider: "Yahoo Finance + Stooq",
      providers: ["yahoo-v8", "yahoo-v7", "stooq"],
      lastUpdatedAt:
        data.quotes.find((q) => q.source === "live")?.updatedAt ?? cache.cachedAt,
      cacheTtlMs,
      itemCount: data.quotes.length,
      coverageCount: liveQuotes,
      sourceStatus:
        data.source === "live"
          ? liveQuotes === data.quotes.length
            ? "live"
            : "partial"
          : "mock",
      warnings,
      details: {
        instruments: data.quotes.map((q) => ({
          symbol: q.symbol,
          category: q.category,
          source: q.source,
        })),
        cacheExpiresAt: cache.expiresAt,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "global probe failed"
    warnings.push(message)
    return {
      provider: "Yahoo Finance + Stooq",
      lastUpdatedAt: cache.cachedAt,
      cacheTtlMs,
      itemCount: 0,
      coverageCount: 0,
      sourceStatus: "unavailable",
      warnings,
    }
  }
}

/** Runtime data-health snapshot for GET /api/data-health. */
export async function buildDataHealthReport(): Promise<DataHealthReport> {
  let vnData: Awaited<ReturnType<typeof getVietnamData>> | null = null
  let vietnam: DataHealthSection

  try {
    vnData = await getVietnamData()
    vietnam = buildVietnamSectionFromData(vnData)
  } catch (error) {
    vietnam = buildVietnamSectionUnavailable(error)
  }

  const [proprietaryFlow, us, crypto, global] = await Promise.all([
    buildProprietaryFlowSection(),
    buildUsSection(),
    buildCryptoSection(),
    buildGlobalSection(),
  ])

  const foreignFlow = buildForeignFlowSection(vnData)

  return {
    generatedAt: new Date().toISOString(),
    vietnam,
    foreignFlow,
    proprietaryFlow,
    us,
    crypto,
    global,
  }
}
