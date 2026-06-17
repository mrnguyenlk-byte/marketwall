"use client"

import { useMemo } from "react"
import { Radio } from "lucide-react"

import { mergeCryptoAssetsIntoTickerItems } from "@/lib/crypto-market-merge"
import { clientDebug, features } from "@/lib/config/features"
import { useQuotes } from "@/hooks/useQuotes"
import { mergeGlobalQuotesIntoTickerItems } from "@/lib/global-market-merge"
import { mergeMarketQuotesIntoTickerItems } from "@/lib/market-quotes-merge"
import { mergeVietnamIndicesIntoTickerItems } from "@/lib/vietnam-market-merge"
import { useOpenSymbolDetail } from "@/hooks/useOpenSymbolDetail"
import { useLang } from "@/lib/i18n"
import {
  useCryptoMarkets,
  useGlobalMarkets,
  useMarketsLoading,
  useVietnamMarkets,
} from "@/lib/swr/use-market-apis"
import type { TickerBarItem } from "@/lib/market-types"

import { TickerBarSkeleton } from "./data-skeletons"
import { Sparkline, fmt, signClass } from "./shared"
import { SymbolLogo } from "./symbol-logo"
import { cn } from "@/lib/utils"

function TickerItem({
  item,
  onSelect,
  interactive,
  compact,
}: {
  item: TickerBarItem
  onSelect: (symbol: string) => void
  interactive: boolean
  compact?: boolean
}) {
  const up = item.trend === "up"
  const absChange = (item.price * item.changePercent) / 100
  const className = cn(
    "flex items-center gap-1.5 whitespace-nowrap",
    compact ? "px-2.5 py-0.5" : "px-4 py-2",
    interactive && "transition-colors hover:bg-secondary/40",
  )
  const content = (
    <>
      <SymbolLogo symbol={item.symbol} size="sm" />
      <span className="text-xs font-bold text-foreground">{item.symbol}</span>
      <span className="font-mono text-xs tabular-nums text-foreground">{fmt(item.price)}</span>
      <span className={cn("font-mono text-xs tabular-nums", signClass(absChange))}>
        {absChange >= 0 ? "+" : ""}
        {fmt(Math.abs(absChange))}
      </span>
      <span className={cn("font-mono text-xs tabular-nums", signClass(item.changePercent))}>
        {item.changePercent >= 0 ? "+" : ""}
        {item.changePercent.toFixed(2)}%
      </span>
      <Sparkline
        data={item.sparkline}
        positive={up}
        className={compact ? "h-3 w-10" : "h-4 w-14"}
        width={compact ? 40 : 56}
        height={compact ? 12 : 16}
      />
    </>
  )

  if (!interactive) {
    return <div className={className}>{content}</div>
  }

  return (
    <button type="button" onClick={() => onSelect(item.symbol)} className={className}>
      {content}
    </button>
  )
}

export function TickerBar({
  items: fallbackItems,
  compact = false,
}: {
  items: TickerBarItem[]
  compact?: boolean
}) {
  const { t } = useLang()
  const { openSymbol, enabled: symbolClickEnabled } = useOpenSymbolDetail()

  const vietnam = useVietnamMarkets()
  const global = useGlobalMarkets()
  const crypto = useCryptoMarkets()
  const marketQuotes = useQuotes()
  const loading = useMarketsLoading(vietnam, global, crypto, marketQuotes)

  const items = useMemo(() => {
    if (!features.liveClientFetch) {
      clientDebug("TickerBar", "using static fallback")
      return fallbackItems
    }

    let merged = fallbackItems
    if (vietnam.data?.indices?.length) {
      merged = mergeVietnamIndicesIntoTickerItems(merged, vietnam.data.indices)
    }
    if (global.data?.quotes?.length) {
      merged = mergeGlobalQuotesIntoTickerItems(merged, global.data.quotes)
    }
    if (crypto.data?.assets?.length) {
      merged = mergeCryptoAssetsIntoTickerItems(merged, crypto.data.assets)
    }
    if (marketQuotes.data?.quotes?.length) {
      merged = mergeMarketQuotesIntoTickerItems(merged, marketQuotes.data.quotes)
    }
    return merged
  }, [fallbackItems, vietnam.data, global.data, crypto.data, marketQuotes.data])

  if (loading) {
    return <TickerBarSkeleton count={Math.min(fallbackItems.length, 10)} compact={compact} />
  }

  const dataUnavailable =
    Boolean(marketQuotes.error) ||
    marketQuotes.data?.unavailable === true

  const symbols = items.map((item) => item.symbol)
  const itemBySymbol = Object.fromEntries(items.map((item) => [item.symbol, item]))

  return (
    <div
      className={cn(
        "flex w-full items-stretch border-t border-border bg-surface-elevated",
        compact && "max-h-7",
      )}
    >
      <div
        className={cn(
          "z-10 flex shrink-0 items-center gap-1 border-r border-border bg-surface-muted",
          compact ? "px-2 py-0" : "px-3",
        )}
      >
        <Radio className="size-3 text-gain" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-wide text-gain">{t("misc.live")}</span>
      </div>
      <div className="relative flex flex-1 overflow-hidden">
        {dataUnavailable && (
          <span className="absolute right-2 top-1/2 z-20 -translate-y-1/2 text-[10px] text-muted-foreground">
            {t("error.marketDataUnavailable")}
          </span>
        )}
        <div className="ticker-track flex w-max items-center divide-x divide-border/60">
          {symbols.map((s) => {
            const item = itemBySymbol[s]
            if (!item) return null
            return (
              <TickerItem
                key={`a-${s}`}
                item={item}
                onSelect={(symbol) => {
                  const item = itemBySymbol[symbol]
                  openSymbol(symbol, {
                    hint: item
                      ? { price: item.price, changePercent: item.changePercent }
                      : undefined,
                  })
                }}
                interactive={symbolClickEnabled}
                compact={compact}
              />
            )
          })}
          {symbols.map((s) => {
            const item = itemBySymbol[s]
            if (!item) return null
            return (
              <TickerItem
                key={`b-${s}`}
                item={item}
                onSelect={(symbol) => {
                  const item = itemBySymbol[symbol]
                  openSymbol(symbol, {
                    hint: item
                      ? { price: item.price, changePercent: item.changePercent }
                      : undefined,
                  })
                }}
                interactive={symbolClickEnabled}
                compact={compact}
              />
            )
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-elevated to-transparent" />
      </div>
    </div>
  )
}
