"use client"

import { ArrowUpRight, BarChart3, Bitcoin, Globe, Newspaper, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/i18n"
import { marketNews } from "@/lib/market-data"
import { SectionHeading } from "./shared"

const iconMap = {
  markets: TrendingUp,
  macro: Globe,
  crypto: Bitcoin,
  commodities: BarChart3,
  default: Newspaper,
} as const

export function MarketNews() {
  const { t, lang } = useLang()

  return (
    <section aria-labelledby="news-title" className="h-full">
      <SectionHeading
        title={t("sec.news")}
        action={
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
            {t("action.viewAll")}
            <ArrowUpRight className="size-3.5" />
          </Button>
        }
      />
      <Card className="h-[calc(100%-2.25rem)] py-0">
        <CardContent className="flex h-full flex-col px-0">
          <ul className="divide-y divide-border">
            {marketNews.map((n, i) => {
              const Icon =
                iconMap[n.categoryKey as keyof typeof iconMap] ?? iconMap.default
              return (
                <li key={i}>
                  <a
                    href="#"
                    className="group flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-secondary/40"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground group-hover:text-primary">
                        {n.title[lang]}
                      </p>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {n.time[lang]}
                      </span>
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
