"use client"

import { ExternalLink, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/lib/i18n"
import { featuredPlatforms } from "@/lib/market-data"
import { SectionHeading } from "./shared"

function BrokerLogo({ initials }: { initials: string }) {
  return (
    <span className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-secondary via-secondary/60 to-card text-xl font-bold text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-border/70">
      {initials}
    </span>
  )
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center justify-center gap-0.5 text-warn">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3 ${i < Math.round(rating) ? "fill-current" : "fill-none opacity-30"}`}
          aria-hidden
        />
      ))}
      <span className="ml-0.5 font-mono text-xs font-bold tabular-nums text-foreground">
        {rating.toFixed(1)}
      </span>
    </span>
  )
}

export function BrokerHighlights() {
  const { t, lang } = useLang()

  return (
    <section aria-labelledby="platforms-title">
      <SectionHeading title={t("sec.brokers")} />
      <div className="grid grid-cols-6 gap-3">
        {featuredPlatforms.map((b) => (
          <Card
            key={b.name}
            className="gap-0 border-border/80 py-0 shadow-sm transition-colors hover:border-primary/40"
          >
            <CardContent className="flex h-full flex-col items-center gap-2.5 px-3 py-4 text-center">
              <BrokerLogo initials={b.initials} />
              <div className="w-full min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{b.name}</p>
                <RatingStars rating={b.rating} />
              </div>

              <p className="line-clamp-2 w-full text-[10px] leading-relaxed text-muted-foreground">
                {b.license[lang]}
              </p>

              <div className="w-full space-y-1 text-[11px]">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {b.category === "vn" ? t("label.brokerageFee") : t("label.spreadFrom")}
                  </span>
                  <span className="font-mono font-semibold text-foreground">{b.spread}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("label.minDeposit")}</span>
                  <span className="font-mono font-semibold text-foreground">{b.minDeposit}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-1">
                {b.platformTags.map((platform) => (
                  <Badge
                    key={platform}
                    variant="secondary"
                    className="h-5 px-1.5 text-[9px] font-semibold"
                  >
                    {platform}
                  </Badge>
                ))}
              </div>

              <a
                href={b.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                {t("misc.visitBroker")}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
