"use client"

import { Radio } from "lucide-react"
import { useLang } from "@/lib/i18n"
import { tickerBarItems } from "@/lib/market-data"
import { ChangePill, Sparkline, fmt } from "./shared"

function TickerItem({ symbol }: { symbol: string }) {
  const item = tickerBarItems.find((t) => t.symbol === symbol)!
  const up = item.trend === "up"
  return (
    <div className="flex items-center gap-2 whitespace-nowrap px-4 py-1.5">
      <span className="text-xs font-bold text-foreground">{item.symbol}</span>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {fmt(item.price)}
      </span>
      <ChangePill value={item.changePercent} className="text-[10px]" />
      <Sparkline
        data={item.sparkline}
        positive={up}
        className="h-4 w-12"
        width={48}
        height={16}
      />
    </div>
  )
}

export function TickerBar() {
  const { t } = useLang()
  const symbols = tickerBarItems.map((item) => item.symbol)

  return (
    <div className="flex w-full items-stretch border-b border-border bg-gradient-to-r from-card to-card/80">
      <div className="z-10 flex shrink-0 items-center gap-1.5 border-r border-border bg-secondary/60 px-3">
        <Radio className="size-3.5 text-gain" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
          {t("misc.live")}
        </span>
      </div>
      <div className="relative flex flex-1 overflow-hidden">
        <div className="ticker-track flex w-max items-center divide-x divide-border">
          {symbols.map((s) => (
            <TickerItem key={`a-${s}`} symbol={s} />
          ))}
          {symbols.map((s) => (
            <TickerItem key={`b-${s}`} symbol={s} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent" />
      </div>
    </div>
  )
}
