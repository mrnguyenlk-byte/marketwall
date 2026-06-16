"use client"

import { useMemo } from "react"
import { Radio } from "lucide-react"

import { mergeCryptoAssetsIntoTickerItems } from "@/lib/crypto-market-merge"
import { clientDebug, features } from "@/lib/config/features"
import { useQuotes } from "@/hooks/useQuotes"
import { mergeGlobalQuotesIntoTickerItems } from "@/lib/global-market-merge"
import { mergeMarketQuotesIntoTickerItems } from "@/lib/market-quotes-merge"
import { mergeVietnamIndicesIntoTickerItems } from "@/lib/vietnam-market-merge"
import { useLang } from "@/lib/i18n"
import { useSymbolDetail } from "@/lib/symbol-detail-context"
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
}: {
  item: TickerBarItem
  onSelect: (symbol: string) => void
  interactive: boolean
}) {
  const up = item.trend === "up"
  const absChange = (item.price * item.changePercent) / 100
  const className = cn(
    "flex items-center gap-2 whitespace-nowrap px-4 py-2",
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
      <Sparkline data={item.sparkline} positive={up} className="h-4 w-14" width={56} height={16} />
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

export function TickerBar({ items: fallbackItems }: { items: TickerBarItem[] }) {
  const { t } = useLang()
  const { openDetail } = useSymbolDetail()

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
    return <TickerBarSkeleton count={Math.min(fallbackItems.length, 10)} />
  }

  const symbols = items.map((item) => item.symbol)
  const itemBySymbol = Object.fromEntries(items.map((item) => [item.symbol, item]))
  const symbolClickEnabled = features.symbolModal

  return (
    <div className="flex w-full items-stretch border-b border-border bg-surface-elevated">
      <div className="z-10 flex shrink-0 items-center gap-1.5 border-r border-border bg-surface-muted px-3">
        <Radio className="size-3.5 text-gain" aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-wide text-gain">{t("misc.live")}</span>
      </div>
      <div className="relative flex flex-1 overflow-hidden">
        <div className="ticker-track flex w-max items-center divide-x divide-border/60">
          {symbols.map((s) => {
            const item = itemBySymbol[s]
            if (!item) return null
            return (
              <TickerItem
                key={`a-${s}`}
                item={item}
                onSelect={openDetail}
                interactive={symbolClickEnabled}
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
                onSelect={openDetail}
                interactive={symbolClickEnabled}
              />
            )
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-elevated to-transparent" />
      </div>
    </div>
  )
}
