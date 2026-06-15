"use client"

import { Card } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { sidebarOverview } from "@/lib/market-data"
import { ChangePill, Sparkline, fmt } from "./shared"

export function MarketOverview() {
  const { t, lang } = useLang()

  return (
    <Card className="w-full gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-card to-card/70 px-3 py-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="h-3.5 w-0.5 rounded-full bg-primary" aria-hidden />
          {t("sec.overview")}
        </h2>
      </div>
      <ul className="divide-y divide-border/80">
        {sidebarOverview.map((item) => {
          const up = item.trend === "up"
          return (
            <li key={item.symbol}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold leading-tight text-foreground">
                    {item.symbol}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground">
                    {item.market[lang]}
                  </p>
                </div>
                <Sparkline
                  data={item.sparkline}
                  positive={up}
                  className="h-5 w-10 shrink-0"
                  width={40}
                  height={20}
                />
                <div className="w-[62px] shrink-0 text-right">
                  <p className="font-mono text-[11px] tabular-nums leading-tight text-foreground">
                    {fmt(item.price)}
                  </p>
                  <ChangePill
                    value={item.changePercent}
                    showIcon={false}
                    className="mt-0.5 justify-end px-0.5 py-0 text-[9px]"
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
