"use client"

import { AlertTriangle, ExternalLink, Gift } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/lib/i18n"
import {
  globalPlatforms,
  vnStockPlatforms,
  type Broker,
  type BrokerBadge,
} from "@/lib/market-data"
import { cn } from "@/lib/utils"

const BADGE_STYLES: Record<BrokerBadge, string> = {
  bestOverall: "border-primary/40 bg-primary/15 text-primary",
  bestBeginners: "border-gain/40 bg-gain/15 text-gain",
  lowestSpread: "border-warn/40 bg-warn/15 text-warn",
  fastWithdrawal: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
}

function BrokerLogo({ broker }: { broker: Broker }) {
  return (
    <span
      className={cn(
        "flex size-20 shrink-0 items-center justify-center rounded-xl text-2xl font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 sm:size-24 sm:text-3xl",
        broker.category === "vn"
          ? "bg-gradient-to-br from-[#c41e3a]/25 via-secondary/60 to-card text-[#f87171] ring-[#c41e3a]/30"
          : "bg-gradient-to-br from-secondary via-secondary/60 to-card text-primary ring-border/70",
      )}
      aria-hidden
    >
      {broker.initials}
    </span>
  )
}

function BrokerBadges({ badges }: { badges: BrokerBadge[] }) {
  const { t } = useLang()
  if (badges.length === 0) return null
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {badges.map((b) => (
        <Badge
          key={b}
          variant="outline"
          className={cn("h-5 rounded-md px-1.5 text-[10px] font-semibold", BADGE_STYLES[b])}
        >
          {t(`brokers.badge.${b}`)}
        </Badge>
      ))}
    </div>
  )
}

function BrokerCard({ broker }: { broker: Broker }) {
  const { t, lang } = useLang()
  const isVn = broker.category === "vn"

  return (
    <Card className="group gap-0 overflow-hidden border-border/80 py-0 shadow-sm transition-all hover:border-primary/35">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start gap-4">
          <BrokerLogo broker={broker} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-foreground">{broker.name}</p>
            <BrokerBadges badges={broker.badges} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {isVn
                ? `${t("label.brokerageFee")} ${broker.spread} · ${broker.minDeposit}`
                : `${broker.spread} · ${broker.minDeposit} · ${broker.leverage}`}
            </p>
          </div>
        </div>

        <div className="rounded-md border border-warn/30 bg-warn/10 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-warn">
            <Gift className="size-3 shrink-0" aria-hidden />
            {t("label.offer")}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
            {broker.offer[lang]}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">{broker.license[lang]}</p>

        <a
          href={broker.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          {t("misc.visitBroker")}
        </a>
      </CardContent>
    </Card>
  )
}

function DisclaimerBlock() {
  const { t } = useLang()
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 ring-1 ring-warn/20">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
      <p className="text-sm leading-relaxed text-warn/90">{t("broker.disclaimer")}</p>
    </div>
  )
}

function PlatformSection({ title, items }: { title: string; items: Broker[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((broker) => (
          <BrokerCard key={broker.name} broker={broker} />
        ))}
      </div>
    </section>
  )
}

export function BrokersPageContent() {
  const { t } = useLang()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
          {t("sec.brokers")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("brokers.hero.tagline")}</p>
      </header>

      <PlatformSection title={t("platforms.vnSection")} items={vnStockPlatforms} />
      <PlatformSection title={t("platforms.globalSection")} items={globalPlatforms} />

      <DisclaimerBlock />
    </div>
  )
}
