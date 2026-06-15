"use client"

import { ExternalLink, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/i18n"
import { brokers } from "@/lib/market-data"
import { SectionHeading } from "./shared"

export function BrokerHighlights() {
  const { t, lang } = useLang()
  return (
    <section aria-labelledby="brokers-title">
      <SectionHeading title={t("sec.brokers")} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {brokers.map((b) => (
          <Card
            key={b.name}
            className="gap-0 border-border/80 py-0 shadow-sm transition-colors hover:border-primary/40"
          >
            <CardContent className="flex h-full flex-col gap-2.5 px-3 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-secondary to-secondary/50 text-sm font-bold text-primary ring-1 ring-border/60">
                  {b.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {b.name}
                  </p>
                  <span className="flex items-center gap-0.5 text-xs text-warn">
                    <Star className="size-3 fill-current" aria-hidden />
                    <span className="font-mono font-bold tabular-nums">
                      {b.rating.toFixed(1)}
                    </span>
                  </span>
                </div>
              </div>

              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {b.license[lang]}
              </p>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("label.spreadFrom")}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {b.spread}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("label.minDeposit")}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {b.minDeposit}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("label.platforms")}</span>
                  <span className="text-right font-medium text-foreground">
                    {b.platforms[lang]}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-1.5 pt-1">
                <Button size="sm" className="h-8 w-full gap-1.5 text-xs font-semibold">
                  <ExternalLink className="size-3.5" aria-hidden />
                  {t("misc.visitBroker")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-full text-[10px] font-medium"
                >
                  {t("misc.viewReview")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
        {t("broker.disclaimer")}
      </p>
    </section>
  )
}
