"use client"

import { ArrowUpRight, Newspaper } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/i18n"
import { news } from "@/lib/market-data"
import { SectionHeading } from "./shared"

export function MarketNews() {
  const { t, lang } = useLang()
  const [lead, ...rest] = news

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
          {/* Lead story */}
          <a
            href="#"
            className="group flex flex-col gap-2 border-b border-border px-4 py-3 transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                {lead.category[lang]}
              </Badge>
              <span className="text-xs text-muted-foreground">{lead.source}</span>
            </div>
            <p className="text-sm font-semibold leading-snug text-foreground text-balance group-hover:text-primary">
              {lead.title[lang]}
            </p>
            <span className="text-[11px] text-muted-foreground">
              {lead.time[lang]}
            </span>
          </a>

          <ul className="flex-1 divide-y divide-border">
            {rest.map((n, i) => (
              <li key={i}>
                <a
                  href="#"
                  className="group flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/40"
                >
                  <Newspaper className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm leading-snug text-foreground group-hover:text-primary">
                      {n.title[lang]}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/70">
                        {n.category[lang]}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{n.time[lang]}</span>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
