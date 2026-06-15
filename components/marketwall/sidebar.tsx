"use client"

import { ArrowRight, BarChart3, Briefcase, Check, Sparkles, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { MarketOverview } from "./market-overview"

function TradeSmarterAd() {
  const { t } = useLang()
  return (
    <Card className="relative gap-0 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/25 via-[#0d2847] to-card p-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-primary/20 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-card/80 to-transparent"
        aria-hidden
      />
      <div className="relative flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/40 to-primary/10 text-primary shadow-inner ring-1 ring-primary/30">
            <BarChart3 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="size-3 text-warn" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Premium
              </span>
            </div>
            <p className="text-sm font-bold leading-snug text-foreground">
              {t("ad.brokerPromo.title")}
            </p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {t("ad.brokerPromo.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-end gap-1 rounded-md bg-black/25 px-2 py-1.5 ring-1 ring-white/5">
          {[32, 48, 40, 56, 44, 62].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-primary/30 to-primary"
              style={{ height: `${h}%`, minHeight: 12, maxHeight: 28 }}
              aria-hidden
            />
          ))}
          <TrendingUp className="ml-1 size-4 shrink-0 text-gain" aria-hidden />
        </div>
        <Button size="sm" className="h-8 w-full gap-1.5 text-xs font-semibold shadow-md">
          {t("ad.brokerPromo.cta")}
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </Card>
  )
}

function ProBrokerAd() {
  const { t } = useLang()
  const bullets = [
    "ad.proBroker.b1",
    "ad.proBroker.b2",
    "ad.proBroker.b3",
    "ad.proBroker.b4",
  ] as const
  return (
    <Card className="relative gap-0 overflow-hidden border-warn/25 bg-gradient-to-br from-warn/10 via-secondary/50 to-card p-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <div
        className="pointer-events-none absolute -left-4 top-1/2 size-20 -translate-y-1/2 rounded-full bg-warn/10 blur-xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-2.5 p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-warn/30 to-warn/5 text-warn ring-1 ring-warn/25">
            <Briefcase className="size-4" aria-hidden />
          </span>
          <p className="text-sm font-bold leading-snug text-foreground">
            {t("ad.proBroker.title")}
          </p>
        </div>
        <ul className="space-y-1 text-xs leading-snug text-muted-foreground">
          {bullets.map((key) => (
            <li key={key} className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden />
              {t(key)}
            </li>
          ))}
        </ul>
        <Button
          size="sm"
          className="h-8 w-full bg-warn text-xs font-semibold text-background shadow-md hover:bg-warn/90"
        >
          {t("ad.proBroker.cta")}
        </Button>
      </div>
    </Card>
  )
}

export function Sidebar() {
  return (
    <div className="space-y-3 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
      <TradeSmarterAd />
      <ProBrokerAd />
      <MarketOverview />
    </div>
  )
}
