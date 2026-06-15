"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { breadth } from "@/lib/market-data"
import { SectionHeading } from "./shared"

function Stat({ label, value, tone }: { label: string; value: number; tone?: "gain" | "loss" }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={
          "font-mono text-sm font-semibold tabular-nums " +
          (tone === "gain"
            ? "text-gain"
            : tone === "loss"
              ? "text-loss"
              : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  )
}

export function MarketBreadth() {
  const { t, lang } = useLang()

  return (
    <section aria-labelledby="breadth-title">
      <SectionHeading title={t("sec.breadth")} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {breadth.map((b) => {
          const total = b.advancing + b.declining + b.unchanged
          const advPct = (b.advancing / total) * 100
          const uncPct = (b.unchanged / total) * 100
          const decPct = (b.declining / total) * 100
          return (
            <Card key={b.market.en}>
              <CardContent className="px-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {b.market[lang]}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {total.toLocaleString()}
                  </span>
                </div>

                {/* advance/decline bar */}
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="bg-gain" style={{ width: `${advPct}%` }} />
                  <div className="bg-neutral/50" style={{ width: `${uncPct}%` }} />
                  <div className="bg-loss" style={{ width: `${decPct}%` }} />
                </div>
                <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums">
                  <span className="text-gain">{b.advancing}</span>
                  <span className="text-muted-foreground">{b.unchanged}</span>
                  <span className="text-loss">{b.declining}</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
                  <Stat label={t("label.newHighs")} value={b.newHighs} tone="gain" />
                  <Stat label={t("label.newLows")} value={b.newLows} tone="loss" />
                  <Stat label={t("label.aboveMa")} value={b.aboveMa} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
