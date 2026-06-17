"use client"

import { useMemo, useState, type ReactNode } from "react"
import { AlertTriangle, ExternalLink, Filter, Star, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/lib/i18n"
import {
  GLOBAL_BROKER_FILTERS,
  globalPlatforms,
  vnStockPlatforms,
  filterGlobalBrokers,
  type Broker,
  type BrokerBadge,
  type GlobalBrokerFilterId,
} from "@/lib/broker-data"
import { brokerSlug } from "@/lib/brokers/registry"
import { cn } from "@/lib/utils"
import { DashboardCard, DashboardCardBody, WidgetHeader } from "./shared"

const BADGE_STYLES: Record<BrokerBadge, string> = {
  bestOverall: "border-primary/40 bg-primary/15 text-primary",
  bestBeginners: "border-gain/40 bg-gain/15 text-gain",
  lowestSpread: "border-warn/40 bg-warn/15 text-warn",
  fastWithdrawal: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
}

type CompareRow = {
  id: string
  labelKey: string
  getValue: (broker: Broker, lang: "en" | "vi") => string | string[]
}

const VN_COMPARE_ROWS: CompareRow[] = [
  {
    id: "fee",
    labelKey: "label.brokerageFee",
    getValue: (b) => b.spread,
  },
  {
    id: "offer",
    labelKey: "label.offer",
    getValue: (b, lang) => b.offer[lang],
  },
  {
    id: "regulator",
    labelKey: "brokers.filter.license",
    getValue: (b, lang) => b.license[lang],
  },
]

const GLOBAL_COMPARE_ROWS: CompareRow[] = [
  {
    id: "rating",
    labelKey: "brokers.filter.rating",
    getValue: (b) => `${b.rating.toFixed(1)} / 5 · ${b.trustScore}/100`,
  },
  {
    id: "spread",
    labelKey: "brokers.filter.spread",
    getValue: (b) => b.spread,
  },
  {
    id: "minDeposit",
    labelKey: "brokers.filter.minDeposit",
    getValue: (b) => b.minDeposit,
  },
  {
    id: "leverage",
    labelKey: "label.leverage",
    getValue: (b) => b.leverage,
  },
  {
    id: "promotions",
    labelKey: "label.promotions",
    getValue: (b, lang) =>
      b.promotions?.map((p) => p[lang]) ?? [b.offer[lang]],
  },
  {
    id: "rebatePerLot",
    labelKey: "label.rebatePerLot",
    getValue: (b, lang) =>
      b.rebatePerLot?.[lang] ?? { en: "—", vi: "—" }[lang],
  },
  {
    id: "marketInterest",
    labelKey: "label.marketInterest",
    getValue: (b, lang) => {
      if (!b.marketInterest) return "—"
      return {
        en: { high: "High", medium: "Medium", low: "Low" }[b.marketInterest],
        vi: { high: "Cao", medium: "Trung bình", low: "Thấp" }[b.marketInterest],
      }[lang]
    },
  },
  {
    id: "regulator",
    labelKey: "brokers.filter.license",
    getValue: (b, lang) => b.license[lang],
  },
]

function BrokerLogo({ broker, variant }: { broker: Broker; variant: "vn" | "global" }) {
  return (
    <span
      className={cn(
        "flex h-16 w-[4.75rem] shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ring-1 sm:h-[4.5rem] sm:w-20 sm:text-2xl",
        variant === "vn"
          ? "bg-gradient-to-br from-[#c41e3a]/30 via-secondary/50 to-card text-[#fca5a5] ring-[#c41e3a]/35"
          : "bg-gradient-to-br from-primary/25 via-secondary/50 to-card text-primary ring-primary/25",
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
    <div className="flex flex-wrap justify-center gap-1">
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

function RatingPill({ broker }: { broker: Broker }) {
  const { t } = useLang()
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
      <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary/80 px-2 py-0.5 font-semibold text-foreground">
        <Star className="size-3 fill-warn text-warn" aria-hidden />
        {broker.rating.toFixed(1)}
      </span>
      <span className="text-muted-foreground">
        {t("label.trustScore")}: {broker.trustScore}
      </span>
    </div>
  )
}

function CellValue({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1 text-left text-xs leading-snug text-foreground">
        {value.map((item) => (
          <li key={item} className="flex items-start gap-1.5">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/70" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
  }
  return <span className="text-xs leading-snug text-foreground">{value}</span>
}

function BrokerCardHeader({
  broker,
  variant,
  highlighted,
}: {
  broker: Broker
  variant: "vn" | "global"
  highlighted?: boolean
}) {
  const { t } = useLang()
  const slug = brokerSlug(broker.name)

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center gap-3 rounded-xl border p-3 text-center transition-colors sm:p-4",
        variant === "vn"
          ? "border-[#c41e3a]/20 bg-[#c41e3a]/[0.04] hover:border-[#c41e3a]/35"
          : "border-primary/15 bg-primary/[0.04] hover:border-primary/30",
        highlighted && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
      )}
    >
      <BrokerLogo broker={broker} variant={variant} />
      <div className="w-full min-w-0 space-y-1.5">
        <p className="truncate text-sm font-bold text-foreground sm:text-base">{broker.name}</p>
        {variant === "global" && <RatingPill broker={broker} />}
        <BrokerBadges badges={broker.badges} />
      </div>
      <div className="mt-auto flex w-full flex-col gap-1.5 pt-1">
        <a
          href={`/brokers/${slug}`}
          className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-secondary/50 px-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-secondary/80"
        >
          {t("misc.viewReview")}
        </a>
        <a
          href={`/api/brokers/redirect?slug=${encodeURIComponent(slug)}&source=listing`}
          className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-primary px-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ExternalLink className="size-3" aria-hidden />
          {t("misc.visitBroker")}
        </a>
      </div>
    </div>
  )
}

function ComparisonGrid({
  brokers,
  rows,
  variant,
  highlightedNames,
}: {
  brokers: Broker[]
  rows: CompareRow[]
  variant: "vn" | "global"
  highlightedNames?: Set<string>
}) {
  const { t, lang } = useLang()
  const columnClass =
    brokers.length <= 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : brokers.length === 4
        ? "grid-cols-2 lg:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"

  return (
    <div className="space-y-6">
      <div className={cn("grid gap-3", columnClass)}>
        {brokers.map((broker) => (
          <BrokerCardHeader
            key={broker.name}
            broker={broker}
            variant={variant}
            highlighted={highlightedNames?.has(broker.name)}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card/40">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className={cn(
              "grid gap-3 px-3 py-3 sm:px-4 sm:py-3.5",
              index > 0 && "border-t border-border/60",
              index % 2 === 0 ? "bg-muted/10" : "bg-transparent",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(row.labelKey)}
            </p>
            <div className={cn("grid gap-3", columnClass)}>
              {brokers.map((broker) => (
                <div
                  key={`${row.id}-${broker.name}`}
                  className="min-h-[2.5rem] rounded-lg border border-border/50 bg-background/40 px-3 py-2.5"
                >
                  <CellValue value={row.getValue(broker, lang)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
            {t("brokers.filter.clearAll")}
          </button>
        )}
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

      {hasFilters && (
        <p className="text-xs text-muted-foreground">
          {t("brokers.filter.resultsCount").replace("{count}", String(resultCount))}
        </p>
      )}
    </div>
  )
}

function ComparisonSection({
  title,
  description,
  brokers,
  rows,
  variant,
  filterBar,
  emptyMessage,
}: {
  title: string
  description: string
  brokers: Broker[]
  rows: CompareRow[]
  variant: "vn" | "global"
  filterBar?: ReactNode
  emptyMessage?: string
}) {
  const highlightedNames = useMemo(
    () => new Set(brokers.map((b) => b.name)),
    [brokers],
  )

  return (
    <DashboardCard
      className={cn(
        "ring-0",
        variant === "vn"
          ? "border-[#c41e3a]/25 bg-gradient-to-br from-[#c41e3a]/[0.07] via-card to-card"
          : "border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-card",
      )}
    >
      <WidgetHeader
        title={title}
        className={cn(
          variant === "vn"
            ? "border-[#c41e3a]/20 bg-gradient-to-r from-[#c41e3a]/10 to-card/60"
            : "border-primary/20 bg-gradient-to-r from-primary/10 to-card/60",
        )}
        badge={
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              variant === "vn"
                ? "bg-[#c41e3a]/15 text-[#fca5a5]"
                : "bg-primary/15 text-primary",
            )}
          >
            {brokers.length}
          </span>
        }
      />
      <DashboardCardBody className="space-y-5 px-3 py-4 sm:px-5 sm:py-5">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        {filterBar}
        {brokers.length === 0 && emptyMessage ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <ComparisonGrid
            brokers={brokers}
            rows={rows}
            variant={variant}
            highlightedNames={filterBar ? highlightedNames : undefined}
          />
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

export function BrokersPageContent() {
  const { t } = useLang()
  const [activeFilters, setActiveFilters] = useState<GlobalBrokerFilterId[]>([])

  const filteredGlobalBrokers = useMemo(
    () => filterGlobalBrokers(globalPlatforms, activeFilters),
    [activeFilters],
  )

  const toggleFilter = (id: GlobalBrokerFilterId) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    )
  }

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-8 lg:space-y-10">
      <header className="space-y-2 border-b border-border/60 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("sec.brokers")}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("brokers.hero.tagline")}
        </p>
      </header>

      <ComparisonSection
        title={t("platforms.vnSection")}
        description={t("platforms.vnSectionDesc")}
        brokers={vnStockPlatforms}
        rows={VN_COMPARE_ROWS}
        variant="vn"
      />

      <ComparisonSection
        title={t("platforms.globalSection")}
        description={t("platforms.globalSectionDesc")}
        brokers={filteredGlobalBrokers}
        rows={GLOBAL_COMPARE_ROWS}
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
