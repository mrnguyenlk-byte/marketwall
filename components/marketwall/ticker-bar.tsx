"use client"

import { ArrowDown, ArrowUp, Radio } from "lucide-react"
import { useLang } from "@/lib/i18n"
import { tickerBar } from "@/lib/market-data"
import { fmt, signClass } from "./shared"
import { cn } from "@/lib/utils"

function TickerItem({ index }: { index: number }) {
  const { lang } = useLang()
  const item = tickerBar[index]
  const up = item.changePct > 0
  return (
    <div className="flex items-center gap-2 whitespace-nowrap px-4 py-2">
      <span className="text-xs font-semibold text-foreground">
        {item.name[lang]}
      </span>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {fmt(item.price)}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-mono text-xs font-medium tabular-nums",
          signClass(item.changePct),
        )}
      >
        {up ? (
          <ArrowUp className="size-3" aria-hidden />
        ) : (
          <ArrowDown className="size-3" aria-hidden />
        )}
        {up ? "+" : ""}
        {item.changePct.toFixed(2)}%
      </span>
    </div>
  )
}

export function TickerBar() {
  const { t } = useLang()
  // Duplicate the list so the marquee can loop seamlessly.
  const indices = tickerBar.map((_, i) => i)

  return (
    <div className="flex items-stretch border-b border-border bg-card">
      <div className="z-10 flex shrink-0 items-center gap-1.5 border-r border-border bg-secondary/60 px-3">
        <Radio className="size-3.5 text-gain" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
          {t("misc.live")}
        </span>
      </div>
      <div className="relative flex flex-1 overflow-hidden">
        <div className="ticker-track flex w-max items-center divide-x divide-border">
          {indices.map((i) => (
            <TickerItem key={`a-${i}`} index={i} />
          ))}
          {indices.map((i) => (
            <TickerItem key={`b-${i}`} index={i} />
          ))}
        </div>
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent" />
      </div>
    </div>
  )
}
