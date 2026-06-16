"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart3, Star, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChangePill, fmt } from "@/components/marketwall/shared"
import { features } from "@/lib/config/features"
import { useLang } from "@/lib/i18n"
import { useHeatmapDetail } from "@/lib/heatmap-detail-context"
import type { MarketAsset } from "@/types/market"
import { cn } from "@/lib/utils"

import { StockTabs } from "./StockTabs"

function formatUpdatedAt(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function StockDetailContent({ asset, onClose }: { asset: MarketAsset; onClose: () => void }) {
  const { t, lang } = useLang()
  const [activeTab, setActiveTab] = useState("overview")
  const [watching, setWatching] = useState(false)
  const locale = lang === "vi" ? "vi-VN" : "en-US"

  return (
    <>
      <header className="shrink-0 border-b border-border bg-card/95 px-3 py-3 sm:px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 id="stock-detail-title" className="text-lg font-bold sm:text-xl">
                {asset.symbol}
              </h2>
              <span className="truncate text-sm text-muted-foreground">{asset.name[lang]}</span>
              <span className="rounded bg-secondary/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {asset.exchange}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <p className="font-mono text-2xl font-bold tabular-nums">
                {fmt(asset.price)} {asset.currency}
              </p>
              <ChangePill value={asset.changePercent} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("label.updated")}: {formatUpdatedAt(asset.lastUpdated, locale)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant={activeTab === "chart" ? "secondary" : "ghost"}
              size="sm"
              className="hidden gap-1 sm:inline-flex"
              onClick={() => setActiveTab("chart")}
            >
              <BarChart3 className="size-3.5" aria-hidden />
              {t("heatmapDetail.tab.chart")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden gap-1 sm:inline-flex"
              disabled={!features.watchlist}
              onClick={() => setWatching((prev) => !prev)}
              aria-pressed={watching}
            >
              <Star
                className={cn("size-3.5", watching && "fill-primary text-primary")}
                aria-hidden
              />
              {t("heatmapDetail.watch")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("action.close")}
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </header>

      <StockTabs asset={asset} activeTab={activeTab} onTabChange={setActiveTab} />

      <footer className="shrink-0 border-t border-border bg-card/95 px-4 py-2">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {t("heatmapDetail.disclaimer")}
        </p>
      </footer>
    </>
  )
}

export function StockDetailModal() {
  const { asset, closeAsset } = useHeatmapDetail()

  useEffect(() => {
    if (!asset) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAsset()
    }

    document.addEventListener("keydown", onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [asset, closeAsset])

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) closeAsset()
    },
    [closeAsset],
  )

  if (!asset) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-detail-title"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "flex h-[100dvh] w-full flex-col overflow-hidden border border-border bg-card text-foreground shadow-2xl",
          "sm:h-[88vh] sm:max-h-[88vh] sm:w-[90vw] sm:max-w-[90vw] sm:rounded-lg",
        )}
      >
        <StockDetailContent key={asset.symbol} asset={asset} onClose={closeAsset} />
      </div>
    </div>
  )
}
