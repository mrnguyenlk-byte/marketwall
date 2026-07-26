"use client"

import { useMemo, useState, type ReactNode } from "react"
import { AlertTriangle, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/lib/i18n"
import {
  GLOBAL_BROKER_FILTERS,
  globalPlatforms,
  vnStockPlatforms,
  filterGlobalBrokers,
  type Broker,
  type GlobalBrokerFilterId,
} from "@/lib/broker-data"
import { globalBackcomBadge } from "@/lib/brokers/offer-policy"
import { brokerSlug } from "@/lib/brokers/registry"
import { cn } from "@/lib/utils"
import { BrokerLogo } from "./BrokerLogo"
import { DashboardCard, DashboardCardBody, WidgetHeader } from "./shared"

function brokerLogoGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1"
  if (count === 2) return "grid-cols-2"
  if (count === 3) return "grid-cols-2 sm:grid-cols-3"
  if (count === 4) return "grid-cols-2 sm:grid-cols-4"
  return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
}

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
  const gridClass = brokerLogoGridClass(brokers.length)

  return (
    <div className={cn("grid gap-3 sm:gap-4 md:gap-5", gridClass)}>
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

function GlobalFilterBar({
  activeFilters,
  onToggle,
  onClear,
  resultCount,
}: {
  activeFilters: GlobalBrokerFilterId[]
  onToggle: (id: GlobalBrokerFilterId) => void
  onClear: () => void
  resultCount: number
}) {
  const { t } = useLang()
  const hasFilters = activeFilters.length > 0

  return (
    <div className="sticky top-0 z-20 -mx-1 space-y-3 rounded-xl border border-primary/20 bg-card/95 p-3 shadow-sm backdrop-blur-md sm:-mx-0 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="size-4 text-primary" aria-hidden />
          <span>{t("brokers.filter.activeHint")}</span>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
            {t("brokers.filter.clearAll")}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {GLOBAL_BROKER_FILTERS.map((filterId) => {
          const active = activeFilters.includes(filterId)
          return (
            <button
              key={filterId}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(filterId)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary/20 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {t(`brokers.filter.${filterId}`)}
            </button>
          )
        })}
      </div>

      {hasFilters ? (
        <p className="text-xs text-muted-foreground">
          {t("brokers.filter.resultsCount").replace("{count}", String(resultCount))}
        </p>
      ) : null}
    </div>
  )
}

function BrokerLogoSection({
  title,
  description,
  brokers,
  variant,
  filterBar,
  emptyMessage,
}: {
  title: string
  description: string
  brokers: Broker[]
  variant: "vn" | "global"
  filterBar?: ReactNode
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
        {filterBar}
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
  const [activeFilters, setActiveFilters] = useState<GlobalBrokerFilterId[]>([])

  const filteredGlobalBrokers = useMemo(
    () => filterGlobalBrokers(globalBrokers, activeFilters),
    [globalBrokers, activeFilters],
  )

  const toggleFilter = (id: GlobalBrokerFilterId) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    )
  }

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
        brokers={filteredGlobalBrokers}
        variant="global"
        emptyMessage={t("brokers.filter.noResults")}
        filterBar={
          <GlobalFilterBar
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClear={() => setActiveFilters([])}
            resultCount={filteredGlobalBrokers.length}
          />
        }
      />

      <DisclaimerBlock />
    </div>
  )
}
