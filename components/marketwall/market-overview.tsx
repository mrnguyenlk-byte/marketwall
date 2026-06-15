"use client"



import { useEffect, useState } from "react"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Card } from "@/components/ui/card"

import { mergeCryptoAssetsIntoOverview } from "@/lib/crypto-market-merge"

import { mergeGlobalQuotesIntoOverview } from "@/lib/global-market-merge"

import { reorderIndicesTab } from "@/lib/overview-order"

import { mergeVietnamIndicesIntoOverview } from "@/lib/vietnam-market-merge"

import { useLang } from "@/lib/i18n"

import type { OverviewCategory, OverviewListItem } from "@/lib/market-data"

import type { CryptoAsset } from "@/lib/providers/crypto-provider"

import type { GlobalQuote } from "@/lib/providers/global-market-provider"

import type { VietnamMarketIndex } from "@/lib/providers/vietnam-market-provider"

import { OverviewListSkeleton } from "./data-skeletons"

import { ChangePill, Sparkline, fmt } from "./shared"

import { SymbolLogo } from "./symbol-logo"

import { cn } from "@/lib/utils"



type GlobalMarketsApiResponse = {

  source?: "live" | "mock"

  quotes?: GlobalQuote[]

}



type VietnamMarketsApiResponse = {

  source?: "live" | "mock"

  indices?: VietnamMarketIndex[]

}



type CryptoApiResponse = {

  source?: "live" | "mock"

  assets?: CryptoAsset[]

}



const TABS: OverviewCategory[] = ["indices", "commodities", "crypto", "forex"]



function OverviewRow({ item }: { item: OverviewListItem }) {

  const up = item.trend === "up"

  return (

    <li>

      <button

        type="button"

        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/50"

      >

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

  const [tab, setTab] = useState<OverviewCategory>("indices")

  const [overviewByCategory, setOverviewByCategory] = useState(fallbackOverview)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadMarketData() {

      setLoading(true)

      try {

        const [vietnamRes, globalRes, cryptoRes] = await Promise.all([

          fetch("/api/vietnam-markets", { cache: "no-store" }),

          fetch("/api/global-markets", { cache: "no-store" }),

          fetch("/api/crypto", { cache: "no-store" }),

        ])



        let merged = fallbackOverview



        if (vietnamRes.ok) {

          const vietnamData = (await vietnamRes.json()) as VietnamMarketsApiResponse

          if (vietnamData.indices?.length) {

            merged = mergeVietnamIndicesIntoOverview(merged, vietnamData.indices)

          }

        }



        if (globalRes.ok) {

          const globalData = (await globalRes.json()) as GlobalMarketsApiResponse

          if (globalData.quotes?.length) {

            merged = mergeGlobalQuotesIntoOverview(merged, globalData.quotes)

          }

        }



        if (cryptoRes.ok) {

          const cryptoData = (await cryptoRes.json()) as CryptoApiResponse

          if (cryptoData.assets?.length) {

            merged = mergeCryptoAssetsIntoOverview(merged, cryptoData.assets)

          }

        }



        merged = {

          ...merged,

          indices: reorderIndicesTab(merged.indices),

        }



        if (!cancelled) setOverviewByCategory(merged)

      } catch {

        if (!cancelled) setOverviewByCategory(fallbackOverview)

      } finally {

        if (!cancelled) setLoading(false)

      }

    }



    loadMarketData()

    return () => {

      cancelled = true

    }

  }, [fallbackOverview])



  const items = overviewByCategory[tab]



  return (

    <Card className="flex h-[600px] w-full max-w-[300px] flex-col gap-0 overflow-hidden border-border bg-card p-0">

      <div className="shrink-0 border-b border-border px-3 py-2.5">

        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">

          <span className="h-3.5 w-0.5 rounded-full bg-primary" aria-hidden />

          {t("sec.overview")}

        </h2>

        <div className="flex gap-0.5 rounded-md bg-secondary/60 p-0.5">

          {TABS.map((id) => (

            <button

              key={id}

              type="button"

              onClick={() => setTab(id)}

              className={cn(

                "flex-1 rounded px-1.5 py-1 text-[10px] font-semibold transition-colors",

                tab === id

                  ? "bg-card text-primary shadow-sm"

                  : "text-muted-foreground hover:text-foreground",

              )}

            >

              {t(`overview.${id}`)}

            </button>

          ))}

        </div>

      </div>



      {loading ? (

        <OverviewListSkeleton count={items.length || 12} />

      ) : (

        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">

          {items.map((item) => (

            <OverviewRow key={item.symbol} item={item} />

          ))}

        </ul>

      )}



      <div className="shrink-0 border-t border-border p-2">

        <Button variant="ghost" size="sm" className="h-8 w-full gap-1 text-xs text-primary">

          {t("action.viewMore")}

          <ArrowRight className="size-3" aria-hidden />

        </Button>

      </div>

    </Card>

  )

}


