"use client"

import { AlertTriangle, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/lib/i18n"
import {
  globalPlatforms,
  vnStockPlatforms,
  type Broker,
  type BrokerBadge,
} from "@/lib/broker-data"
import { brokerSlug } from "@/lib/brokers/registry"
import { cn } from "@/lib/utils"

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
    id: "priceTolerance",
    labelKey: "label.priceTolerance",
    getValue: (b, lang) =>
      b.priceTolerance?.[lang] ?? { en: "—", vi: "—" }[lang],
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
        "flex h-14 w-[4.5rem] shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 sm:h-16 sm:w-20 sm:text-xl",
        variant === "vn"
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
    <div className="mt-1 flex flex-wrap justify-center gap-0.5">
      {badges.map((b) => (
        <Badge
          key={b}
          variant="outline"
          className={cn("h-4 rounded-md px-1 text-[9px] font-semibold", BADGE_STYLES[b])}
        >
          {t(`brokers.badge.${b}`)}
        </Badge>
      ))}
    </div>
  )
}

function CellValue({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-0.5 text-left text-xs leading-snug text-foreground">
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

function ComparisonTable({
  brokers,
  rows,
  variant,
}: {
  brokers: Broker[]
  rows: CompareRow[]
  variant: "vn" | "global"
}) {
  const { t, lang } = useLang()

  return (
    <div className="overflow-x-auto rounded-lg border border-border/80 bg-card/50">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            <th className="sticky left-0 z-10 w-36 min-w-36 border-r border-border bg-secondary/95 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
              {t("brokers.compare.metric")}
            </th>
            {brokers.map((broker) => {
              const slug = brokerSlug(broker.name)
              return (
                <th
                  key={broker.name}
                  className="min-w-[9.5rem] border-r border-border/60 px-3 py-3 text-center last:border-r-0"
                >
                  <div className="flex flex-col items-center gap-2">
                    <BrokerLogo broker={broker} variant={variant} />
                    <div className="w-full min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{broker.name}</p>
                      <BrokerBadges badges={broker.badges} />
                    </div>
                    <div className="flex w-full flex-col gap-1">
                      <a
                        href={`/brokers/${slug}`}
                        className="inline-flex h-7 w-full items-center justify-center rounded-md border border-border bg-secondary/40 px-2 text-[10px] font-semibold text-foreground transition-colors hover:bg-secondary/70"
                      >
                        {t("misc.viewReview")}
                      </a>
                      <a
                        href={`/api/brokers/redirect?slug=${encodeURIComponent(slug)}&source=listing`}
                        className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-md bg-primary px-2 text-[10px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <ExternalLink className="size-3" aria-hidden />
                        {t("misc.visitBroker")}
                      </a>
                    </div>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60 last:border-0">
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-border bg-muted/40 px-3 py-2.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
              >
                {t(row.labelKey)}
              </th>
              {brokers.map((broker) => (
                <td
                  key={`${row.id}-${broker.name}`}
                  className="border-r border-border/40 px-3 py-2.5 align-top last:border-r-0"
                >
                  <CellValue value={row.getValue(broker, lang)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ComparisonSection({
  title,
  description,
  brokers,
  rows,
  variant,
}: {
  title: string
  description: string
  brokers: Broker[]
  rows: CompareRow[]
  variant: "vn" | "global"
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border p-4 sm:p-5 lg:p-6",
        variant === "vn"
          ? "border-[#c41e3a]/25 bg-gradient-to-br from-[#c41e3a]/[0.06] via-card to-card shadow-[inset_0_1px_0_0_rgba(196,30,58,0.08)]"
          : "border-primary/20 bg-gradient-to-br from-primary/[0.05] via-card to-card shadow-[inset_0_1px_0_0_rgba(var(--primary),0.06)]",
      )}
    >
      <header className="space-y-1 border-b border-border/60 pb-3">
        <h2
          className={cn(
            "text-base font-bold tracking-tight sm:text-lg",
            variant === "vn" ? "text-[#f87171]" : "text-primary",
          )}
        >
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <ComparisonTable brokers={brokers} rows={rows} variant={variant} />
    </section>
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

export function BrokersPageContent() {
  const { t } = useLang()

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
          {t("sec.brokers")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("brokers.hero.tagline")}</p>
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
        brokers={globalPlatforms}
        rows={GLOBAL_COMPARE_ROWS}
        variant="global"
      />

      <DisclaimerBlock />
    </div>
  )
}
