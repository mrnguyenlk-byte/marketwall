"use client"

import { Card } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { overviewCards, spark } from "@/lib/market-data"
import { ChangePill, Sparkline, SectionHeading, fmt, signClass } from "./shared"
import { cn } from "@/lib/utils"

export function MarketOverview() {
  const { t, lang } = useLang()

  return (
    <section aria-labelledby="overview-title">
      <SectionHeading title={t("sec.overview")} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {overviewCards.map((c) => {
          const up = c.changePct >= 0
          return (
            <Card
              key={c.symbol}
              className="gap-0 overflow-hidden p-0 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2 px-3 pt-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {c.symbol}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.region[lang]}
                  </p>
                </div>
                <ChangePill value={c.changePct} />
              </div>
              <div className="flex items-end justify-between gap-2 px-3 pb-1">
                <div>
                  <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
                    {fmt(c.price)}
                  </p>
                  <p
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      signClass(c.change),
                    )}
                  >
                    {c.change >= 0 ? "+" : ""}
                    {fmt(c.change)}
                  </p>
                </div>
              </div>
              <Sparkline
                data={spark(c.seed, 28, up ? 1 : -1)}
                positive={up}
                className="h-9 w-full"
              />
            </Card>
          )
        })}
      </div>
    </section>
  )
}
