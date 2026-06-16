"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeft, ExternalLink, Gift } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import type { BrokerBadge, BrokerRecord } from "@/types/broker"
import { cn } from "@/lib/utils"

const BADGE_STYLES: Record<BrokerBadge, string> = {
  bestOverall: "border-primary/40 bg-primary/15 text-primary",
  bestBeginners: "border-gain/40 bg-gain/15 text-gain",
  lowestSpread: "border-warn/40 bg-warn/15 text-warn",
  fastWithdrawal: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
}

function BrokerLogo({ broker }: { broker: BrokerRecord }) {
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

export function BrokerDetailPage({ broker }: { broker: BrokerRecord }) {
  const { t, lang } = useLang()
  const redirectUrl = `/api/brokers/redirect?slug=${encodeURIComponent(broker.slug)}&source=detail`

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/brokers"
          className="inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-medium text-primary transition-colors hover:bg-secondary/60"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("sec.brokers")}
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
          {broker.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("brokers.detail.subtitle")}</p>
      </header>

      <Card className="overflow-hidden border-border/80 py-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <BrokerLogo broker={broker} />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-foreground">{broker.name}</p>
              {broker.badges.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {broker.badges.map((b) => (
                    <Badge
                      key={b}
                      variant="outline"
                      className={cn(
                        "h-5 rounded-md px-1.5 text-[10px] font-semibold",
                        BADGE_STYLES[b],
                      )}
                    >
                      {t(`brokers.badge.${b}`)}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("brokers.filter.rating")}: {broker.rating.toFixed(1)} · {t("label.trustScore")}:{" "}
                {broker.trustScore}
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

          <div className="rounded-lg border border-border/80 bg-card px-3 py-1">
            <DetailRow label={t("brokers.filter.license")} value={broker.license[lang]} />
            <DetailRow label={t("brokers.filter.spread")} value={broker.spread} />
            <DetailRow label={t("brokers.filter.minDeposit")} value={broker.minDeposit} />
            <DetailRow label={t("label.leverage")} value={broker.leverage} />
            <DetailRow label={t("brokers.filter.platform")} value={broker.platforms[lang]} />
            <DetailRow label={t("label.execution")} value={broker.executionType[lang]} />
            <DetailRow label={t("brokers.filter.region")} value={broker.region[lang]} />
            <DetailRow label={t("brokers.filter.accountType")} value={broker.accountType[lang]} />
            <DetailRow label={t("label.withdrawal")} value={broker.withdrawalTime[lang]} />
          </div>

          <a
            href={redirectUrl}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            {t("misc.visitBroker")}
          </a>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 ring-1 ring-warn/20">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
        <p className="text-sm leading-relaxed text-warn/90">{t("broker.disclaimer")}</p>
      </div>
    </div>
  )
}
