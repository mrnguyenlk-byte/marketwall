"use client"

import { useMemo, useState } from "react"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { clientDebug, features } from "@/lib/config/features"
import { useQuotes } from "@/hooks/useQuotes"
import { mergeCryptoAssetsIntoOverview } from "@/lib/crypto-market-merge"
import { mergeGlobalQuotesIntoOverview } from "@/lib/global-market-merge"
import { mergeMarketQuotesIntoOverview } from "@/lib/market-quotes-merge"
import { reorderIndicesTab } from "@/lib/overview-order"
import { mergeVietnamIndicesIntoOverview } from "@/lib/vietnam-market-merge"
import { useLang } from "@/lib/i18n"
import { useSymbolDetail } from "@/lib/symbol-detail-context"
import {
  useCryptoMarkets,
  useGlobalMarkets,
  useMarketsLoading,
  useVietnamMarkets,
} from "@/lib/swr/use-market-apis"
import type { OverviewCategory, OverviewListItem } from "@/lib/market-types"

import { OverviewListSkeleton } from "./data-skeletons"

import { ChangePill, Sparkline, fmt, DashboardCard, WidgetHeader } from "./shared"

import { SymbolLogo } from "./symbol-logo"

import { cn } from "@/lib/utils"

const TABS: OverviewCategory[] = ["indices", "commodities", "crypto", "forex"]

function OverviewRow({
  item,
  onSelect,
  interactive,
}: {
  item: OverviewListItem
  onSelect: (symbol: string) => void
  interactive: boolean
}) {
  const up = item.trend === "up"
  const className =
    "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/50"
  const content = (
    <>
      <SymbolLogo symbol={item.symbol} size="md" />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
        {item.symbol}
      </span>
      <Sparkline
        data={item.sparkline}
        positive={up}
        className="h-4 w-10 shrink-0"
        width={40}
        height={16}
      />
      <div className="shrink-0 text-right">
        <p className="font-mono text-[11px] tabular-nums text-foreground">
          {fmt(item.price)}
        </p>
        <ChangePill
          value={item.changePercent}
          showIcon={false}
          className="mt-0.5 px-0.5 py-0 text-[9px]"
        />
      </div>
    </>
  )

  if (!interactive) {
    return (
      <li>
        <div className={className}>{content}</div>
      </li>
    )
  }

  return (
    <li>
      <button type="button" onClick={() => onSelect(item.symbol)} className={className}>
        {content}
      </button>
    </li>
  )
}

export function MarketOverview({
  overviewByCategory: fallbackOverview,
}: {
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>
}) {
  const { t } = useLang()
  const { openDetail } = useSymbolDetail()
  const [tab, setTab] = useState<OverviewCategory>("indices")

  const vietnam = useVietnamMarkets()
  const global = useGlobalMarkets()
  const crypto = useCryptoMarkets()
  const marketQuotes = useQuotes()
  const loading = useMarketsLoading(vietnam, global, crypto, marketQuotes)

  const overviewByCategory = useMemo(() => {
    if (!features.liveClientFetch) {
      clientDebug("MarketOverview", "using static fallback")
      return fallbackOverview
    }

    let merged = fallbackOverview

    if (vietnam.data?.indices?.length) {
      merged = mergeVietnamIndicesIntoOverview(merged, vietnam.data.indices)
    }

    if (global.data?.quotes?.length) {
      merged = mergeGlobalQuotesIntoOverview(merged, global.data.quotes)
    }

    if (crypto.data?.assets?.length) {
      merged = mergeCryptoAssetsIntoOverview(merged, crypto.data.assets)
    }

    if (marketQuotes.data?.quotes?.length) {
      merged = mergeMarketQuotesIntoOverview(merged, marketQuotes.data.quotes)
    }

    return {
      ...merged,
      indices: reorderIndicesTab(merged.indices),
    }
  }, [fallbackOverview, vietnam.data, global.data, crypto.data, marketQuotes.data])

  const items = overviewByCategory[tab]
  const symbolClickEnabled = features.symbolModal
  const dataUnavailable =
    Boolean(marketQuotes.error) ||
    marketQuotes.data?.unavailable === true

  return (
    <DashboardCard className="flex h-[600px] w-full max-w-full flex-col gap-0 overflow-hidden p-0 ring-0">
      <WidgetHeader title={t("sec.overview")} className="flex-col items-stretch">
        <div className="flex w-full basis-full gap-0.5 rounded-md bg-secondary/60 p-0.5">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 rounded px-1.5 py-1 type-secondary-label font-semibold transition-colors",
                tab === id
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`overview.${id}`)}
            </button>
          ))}
        </div>
      </WidgetHeader>

      {loading ? (
        <OverviewListSkeleton count={items.length || 12} />
      ) : dataUnavailable ? (
        <p className="px-3 py-4 type-table text-muted-foreground">{t("error.marketDataUnavailable")}</p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {items.map((item) => (
            <OverviewRow
              key={item.symbol}
              item={item}
              onSelect={openDetail}
              interactive={symbolClickEnabled}
            />
          ))}
        </ul>
      )}

      <div className="shrink-0 border-t border-border p-2">
        <Button variant="ghost" size="sm" className="h-8 w-full gap-1 type-table text-primary">
          {t("action.viewMore")}
          <ArrowRight className="size-3" aria-hidden />
        </Button>
      </div>
    </DashboardCard>
  )
}
