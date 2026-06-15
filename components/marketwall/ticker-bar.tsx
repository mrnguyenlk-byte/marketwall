"use client"



import { useEffect, useState } from "react"

import { Radio } from "lucide-react"

import { mergeCryptoAssetsIntoTickerItems } from "@/lib/crypto-market-merge"

import { mergeGlobalQuotesIntoTickerItems } from "@/lib/global-market-merge"

import { mergeVietnamIndicesIntoTickerItems } from "@/lib/vietnam-market-merge"

import { useLang } from "@/lib/i18n"

import type { TickerBarItem } from "@/lib/market-data"

import type { CryptoAsset } from "@/lib/providers/crypto-provider"

import type { GlobalQuote } from "@/lib/providers/global-market-provider"

import type { VietnamMarketIndex } from "@/lib/providers/vietnam-market-provider"

import { TickerBarSkeleton } from "./data-skeletons"

import { Sparkline, fmt, signClass } from "./shared"

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



function TickerItem({ item }: { item: TickerBarItem }) {

  const up = item.trend === "up"

  const absChange = (item.price * item.changePercent) / 100



  return (

    <div className="flex items-center gap-2 whitespace-nowrap px-4 py-2">

      <SymbolLogo symbol={item.symbol} size="sm" />

      <span className="text-xs font-bold text-foreground">{item.symbol}</span>

      <span className="font-mono text-xs tabular-nums text-foreground">

        {fmt(item.price)}

      </span>

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

        className="h-4 w-14"

        width={56}

        height={16}

      />

    </div>

  )

}



export function TickerBar({ items: fallbackItems }: { items: TickerBarItem[] }) {

  const { t } = useLang()

  const [items, setItems] = useState(fallbackItems)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadTickerData() {

      setLoading(true)

      try {

        const [vietnamRes, globalRes, cryptoRes] = await Promise.all([

          fetch("/api/vietnam-markets", { cache: "no-store" }),

          fetch("/api/global-markets", { cache: "no-store" }),

          fetch("/api/crypto", { cache: "no-store" }),

        ])



        let merged = fallbackItems



        if (vietnamRes.ok) {

          const vietnamData = (await vietnamRes.json()) as VietnamMarketsApiResponse

          if (vietnamData.indices?.length) {

            merged = mergeVietnamIndicesIntoTickerItems(merged, vietnamData.indices)

          }

        }



        if (globalRes.ok) {

          const globalData = (await globalRes.json()) as GlobalMarketsApiResponse

          if (globalData.quotes?.length) {

            merged = mergeGlobalQuotesIntoTickerItems(merged, globalData.quotes)

          }

        }



        if (cryptoRes.ok) {

          const cryptoData = (await cryptoRes.json()) as CryptoApiResponse

          if (cryptoData.assets?.length) {

            merged = mergeCryptoAssetsIntoTickerItems(merged, cryptoData.assets)

          }

        }



        if (!cancelled) setItems(merged)

      } catch {

        if (!cancelled) setItems(fallbackItems)

      } finally {

        if (!cancelled) setLoading(false)

      }

    }



    loadTickerData()

    return () => {

      cancelled = true

    }

  }, [fallbackItems])



  if (loading) {

    return <TickerBarSkeleton count={Math.min(fallbackItems.length, 10)} />

  }



  const symbols = items.map((item) => item.symbol)

  const itemBySymbol = Object.fromEntries(items.map((item) => [item.symbol, item]))



  return (

    <div className="flex w-full items-stretch border-b border-border bg-surface-elevated">

      <div className="z-10 flex shrink-0 items-center gap-1.5 border-r border-border bg-surface-muted px-3">

        <Radio className="size-3.5 text-gain" aria-hidden />

        <span className="text-[11px] font-bold uppercase tracking-wide text-gain">

          {t("misc.live")}

        </span>

      </div>

      <div className="relative flex flex-1 overflow-hidden">

        <div className="ticker-track flex w-max items-center divide-x divide-border/60">

          {symbols.map((s) => (

            <TickerItem key={`a-${s}`} item={itemBySymbol[s]} />

          ))}

          {symbols.map((s) => (

            <TickerItem key={`b-${s}`} item={itemBySymbol[s]} />

          ))}

        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-elevated to-transparent" />

      </div>

    </div>

  )

}


