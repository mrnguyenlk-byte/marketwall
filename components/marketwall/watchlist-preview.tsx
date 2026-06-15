"use client"

import { Plus, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/i18n"
import { watchlistItems, spark } from "@/lib/market-data"
import { ChangePill, Sparkline, SectionHeading, fmt } from "./shared"

export function WatchlistPreview() {
  const { t, lang } = useLang()
  return (
    <section aria-labelledby="watchlist-title" className="h-full">
      <SectionHeading
        title={t("sec.watchlist")}
        badge={<Star className="size-3.5 text-warn" aria-hidden />}
        action={
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
            <Plus className="size-3.5" />
            {t("action.viewAll")}
          </Button>
        }
      />
      <Card className="h-[calc(100%-2.25rem)] py-0">
        <CardContent className="px-0">
          <ul className="divide-y divide-border">
            {watchlistItems.map((w) => {
              const up = w.trend === "up"
              return (
                <li
                  key={w.symbol}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {w.symbol}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {w.name[lang]}
                    </p>
                  </div>
                  <Sparkline
                    data={spark(w.seed, 20, up ? 1 : -1)}
                    positive={up}
                    className="hidden h-7 w-20 sm:block"
                  />
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {fmt(w.price)}
                    </span>
                    <ChangePill value={w.changePercent} showIcon={false} />
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
