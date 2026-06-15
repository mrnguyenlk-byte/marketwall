"use client"

import { Building2, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/i18n"
import { brokers } from "@/lib/market-data"
import { SectionHeading } from "./shared"

export function BrokerHighlights() {
  const { t, lang } = useLang()
  return (
    <section aria-labelledby="brokers-title">
      <SectionHeading title={t("sec.brokers")} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {brokers.map((b) => (
          <Card key={b.name} className="transition-colors hover:border-primary/40">
            <CardContent className="flex h-full flex-col px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary">
                    <Building2 className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {b.name}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-warn">
                      <Star className="size-3 fill-current" aria-hidden />
                      <span className="font-mono tabular-nums">{b.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {b.tag[lang]}
                </Badge>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {b.blurb[lang]}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t("label.minDeposit")}
                  </p>
                  <p className="font-mono font-semibold text-foreground">
                    {b.minDeposit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t("label.assets")}
                  </p>
                  <p className="font-medium text-foreground">{b.assets[lang]}</p>
                </div>
              </div>

              <Button variant="secondary" size="sm" className="mt-3 w-full">
                {t("misc.openBroker")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
