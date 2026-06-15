"use client"



import { useEffect, useState } from "react"

import { ArrowUpRight, BarChart3, Bitcoin, Globe, Newspaper, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { useLang } from "@/lib/i18n"

import type { MarketNewsItem } from "@/lib/market-data"

import { NewsListSkeleton } from "./data-skeletons"

import { SectionHeading } from "./shared"



const iconMap = {

  markets: TrendingUp,

  macro: Globe,

  crypto: Bitcoin,

  commodities: BarChart3,

  default: Newspaper,

} as const



type NewsApiResponse = {

  source?: "live" | "mock"

  uiItems?: MarketNewsItem[]

}



export function MarketNews({ fallbackItems }: { fallbackItems: MarketNewsItem[] }) {

  const { t, lang } = useLang()

  const [items, setItems] = useState<MarketNewsItem[]>(fallbackItems)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadNews() {

      setLoading(true)

      try {

        const res = await fetch("/api/news", { cache: "no-store" })

        if (!res.ok) {

          if (!cancelled) setItems(fallbackItems)

          return

        }

        const data = (await res.json()) as NewsApiResponse

        if (!cancelled && data.uiItems?.length) {

          setItems(data.uiItems)

        }

      } catch {

        if (!cancelled) setItems(fallbackItems)

      } finally {

        if (!cancelled) setLoading(false)

      }

    }



    loadNews()

    return () => {

      cancelled = true

    }

  }, [fallbackItems])



  return (

    <section aria-labelledby="news-title" className="flex h-[320px] flex-col">

      <SectionHeading

        title={t("sec.news")}

        action={

          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">

            {t("action.viewAll")}

            <ArrowUpRight className="size-3.5" />

          </Button>

        }

      />

      <Card className="min-h-0 flex-1 border-border bg-card py-0">

        <CardContent className="flex h-full flex-col px-0">

          {loading ? (

            <NewsListSkeleton count={fallbackItems.length || 5} />

          ) : (

            <ul className="divide-y divide-border">

              {items.map((n, i) => {

                const Icon =

                  iconMap[n.categoryKey as keyof typeof iconMap] ?? iconMap.default

                return (

                  <li key={`${n.title.en}-${i}`}>

                    <a

                      href={n.url ?? "#"}

                      target={n.url ? "_blank" : undefined}

                      rel={n.url ? "noopener noreferrer" : undefined}

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

          )}

        </CardContent>

      </Card>

    </section>

  )

}


