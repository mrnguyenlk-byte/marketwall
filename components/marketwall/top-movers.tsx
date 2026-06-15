"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { topMovers, type TopMover } from "@/lib/market-data"
import { ChangePill, SectionHeading, fmt } from "./shared"

function MoverList({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: TopMover[]
}) {
  const { lang } = useLang()
  return (
    <Card className="py-0">
      <CardContent className="px-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          {icon}
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <ul className="divide-y divide-border">
          {items.map((m) => (
            <li
              key={m.symbol}
              className="flex items-center justify-between gap-2 px-4 py-2.5 transition-colors hover:bg-secondary/40"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{m.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.name[lang]}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm tabular-nums text-foreground">
                  {fmt(m.price)}
                </span>
                <ChangePill value={m.changePercent} className="w-[72px] justify-center" />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function TopMovers() {
  const { t } = useLang()
  return (
    <section aria-labelledby="movers-title">
      <SectionHeading title={t("sec.topMovers")} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <MoverList
          title={t("label.gainers")}
          icon={<TrendingUp className="size-4 text-gain" aria-hidden />}
          items={topMovers.gainers}
        />
        <MoverList
          title={t("label.losers")}
          icon={<TrendingDown className="size-4 text-loss" aria-hidden />}
          items={topMovers.losers}
        />
      </div>
    </section>
  )
}
