"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { currencyPerformance, spark } from "@/lib/market-data"
import { ChangePill, Sparkline, SectionHeading, fmt, signClass } from "./shared"
import { cn } from "@/lib/utils"

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn("font-mono text-xs font-medium tabular-nums", signClass(value))}
      >
        {value >= 0 ? "+" : ""}
        {value.toFixed(2)}%
      </span>
    </div>
  )
}

export function CurrencyPerformance() {
  const { t } = useLang()

  return (
    <section aria-labelledby="currencies-title">
      <SectionHeading title={t("sec.currencies")} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {currencyPerformance.map((c) => {
          const up = c.trend === "up"
          return (
            <Card key={c.pair}>
              <CardContent className="px-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {c.pair}
                    </p>
                    <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
                      {fmt(c.price)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ChangePill value={c.changePercent} />
                    <Sparkline
                      data={spark(c.seed, 24, up ? 1 : -1)}
                      positive={up}
                      className="h-8 w-24"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-6 border-t border-border pt-3">
                  <MiniStat label="1D" value={c.changePercent} />
                  <MiniStat label="1W" value={c.weekChangePercent} />
                  <MiniStat label="1M" value={c.monthChangePercent} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
