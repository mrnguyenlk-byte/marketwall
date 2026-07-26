"use client"

import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/lib/i18n"
import {
  globalPlatforms,
  vnStockPlatforms,
  type Broker,
} from "@/lib/broker-data"
import { globalBackcomBadge } from "@/lib/brokers/offer-policy"
import { brokerSlug } from "@/lib/brokers/registry"
import { cn } from "@/lib/utils"
import { BrokerLogo } from "./BrokerLogo"
import { DashboardCard, DashboardCardBody, WidgetHeader } from "./shared"

function BackcomBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="h-7 rounded-lg border-primary/40 bg-primary/15 px-2.5 text-xs font-bold text-primary sm:text-sm"
    >
      {label}
    </Badge>
  )
}

function VnLogoTile({ broker }: { broker: Broker }) {
  const slug = brokerSlug(broker.name)
  const href = `/api/brokers/redirect?slug=${encodeURIComponent(slug)}&source=listing`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={broker.name}
      className={cn(
        "group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border p-4 sm:p-5",
        "border-[#c41e3a]/25 bg-gradient-to-br from-[#c41e3a]/[0.08] via-card/80 to-card",
        "transition-all duration-200 hover:-translate-y-1 hover:border-[#c41e3a]/50",
        "hover:shadow-[0_12px_40px_-12px_rgba(196,30,58,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c41e3a]/60",
      )}
    >
      <BrokerLogo broker={broker} variant="vn" size="2xl" />
      <span className="sr-only">{broker.name}</span>
    </a>
  )
}

function GlobalLogoTile({ broker }: { broker: Broker }) {
  const slug = brokerSlug(broker.name)
  const href = `/api/brokers/redirect?slug=${encodeURIComponent(slug)}&source=listing`
  const backcom = globalBackcomBadge({
    backcomType: broker.backcomType,
    backcomValue: broker.backcomValue,
  })

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={broker.name}
      className={cn(
        "group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border p-4 sm:p-5",
        "border-primary/25 bg-gradient-to-br from-primary/[0.08] via-card/80 to-card",
        "transition-all duration-200 hover:-translate-y-1 hover:border-primary/50",
        "hover:shadow-[0_12px_40px_-12px_rgba(var(--primary),0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
      )}
    >
      <BrokerLogo broker={broker} variant="global" size="2xl" />
      {backcom ? <BackcomBadge label={backcom} /> : null}
      <span className="sr-only">{broker.name}</span>
    </a>
  )
}

function LogoGrid({
  brokers,
  variant,
}: {
  brokers: Broker[]
  variant: "vn" | "global"
}) {
  return (
    <div
      className="grid justify-center gap-3 sm:gap-4 md:gap-5"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 12rem))",
      }}
    >
      {brokers.map((broker) =>
        variant === "vn" ? (
          <VnLogoTile key={broker.name} broker={broker} />
        ) : (
          <GlobalLogoTile key={broker.name} broker={broker} />
        ),
      )}
    </div>
  )
}

function BrokerLogoSection({
  title,
  description,
  brokers,
  variant,
  emptyMessage,
}: {
  title: string
  description: string
  brokers: Broker[]
  variant: "vn" | "global"
  emptyMessage?: string
}) {
  return (
    <DashboardCard
      className={cn(
        "ring-0",
        variant === "vn"
          ? "border-[#c41e3a]/30 bg-gradient-to-br from-[#c41e3a]/[0.12] via-card to-card shadow-[0_0_60px_-20px_rgba(196,30,58,0.25)]"
          : "border-primary/30 bg-gradient-to-br from-primary/[0.1] via-card to-card shadow-[0_0_60px_-20px_rgba(var(--primary),0.2)]",
      )}
    >
      <WidgetHeader
        title={title}
        className={cn(
          variant === "vn"
            ? "border-[#c41e3a]/25 bg-gradient-to-r from-[#c41e3a]/15 to-card/60"
            : "border-primary/25 bg-gradient-to-r from-primary/15 to-card/60",
        )}
        badge={
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              variant === "vn"
                ? "bg-[#c41e3a]/20 text-[#fca5a5]"
                : "bg-primary/20 text-primary",
            )}
          >
            {brokers.length}
          </span>
        }
      />
      <DashboardCardBody className="space-y-4 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5">
        <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
        {brokers.length === 0 && emptyMessage ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <LogoGrid brokers={brokers} variant={variant} />
        )}
      </DashboardCardBody>
    </DashboardCard>
  )
}

function DisclaimerBlock() {
  const { t } = useLang()
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3.5 ring-1 ring-warn/20">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
      <p className="text-sm leading-relaxed text-warn/90">{t("broker.disclaimer")}</p>
    </div>
  )
}

export function BrokersPageContent({
  vnBrokers = vnStockPlatforms,
  globalBrokers = globalPlatforms,
}: {
  vnBrokers?: Broker[]
  globalBrokers?: Broker[]
} = {}) {
  const { t } = useLang()

  return (
    <div className="mx-auto w-full max-w-[112rem] space-y-8 lg:space-y-10">
      <header className="space-y-2 border-b border-border/60 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("sec.brokers")}
        </h1>
        <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("brokers.hero.tagline")}
        </p>
      </header>

      <BrokerLogoSection
        title={t("platforms.vnSection")}
        description={t("platforms.vnSectionDesc")}
        brokers={vnBrokers}
        variant="vn"
      />

      <BrokerLogoSection
        title={t("platforms.globalSection")}
        description={t("platforms.globalSectionDesc")}
        brokers={globalBrokers}
        variant="global"
        emptyMessage={t("brokers.filter.noResults")}
      />

      <DisclaimerBlock />
    </div>
  )
}
