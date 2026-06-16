"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { clientDebug, features } from "@/lib/config/features"
import { buildStrengthSeries } from "@/lib/currency-strength/calculate-strength"
import type { StrengthCoverage } from "@/lib/currency-strength"
import { useLang } from "@/lib/i18n"
import {
  currencyStrengthItems as currencyStrengthFallback,
  type CurrencyStrengthMockItem,
} from "@/lib/currency-strength-mock"
import {
  useCurrencyStrength,
  type CurrencyStrengthResponse,
} from "@/hooks/useCurrencyStrength"
import { SectionHeading } from "./shared"
import { cn } from "@/lib/utils"

const STRENGTH_CURRENCY_COUNT = 8
const STRENGTH_SCALE_MIN = 0
const STRENGTH_SCALE_MAX = 100
const STRENGTH_NEUTRAL = 50

const RANK_KEYS_BY_POSITION: Record<number, string> = {
  1: "strength.strongest",
  2: "strength.veryStrong",
}

function rankKeyForPosition(rank: number, total: number): string {
  if (rank <= 2) return RANK_KEYS_BY_POSITION[rank]
  const ratio = rank / total
  if (ratio <= 0.45) return "strength.strong"
  if (ratio <= 0.7) return "strength.neutral"
  if (ratio < 1) return "strength.weak"
  return "strength.weakest"
}

function assignRankKeys(items: CurrencyStrengthMockItem[]): CurrencyStrengthMockItem[] {
  const sorted = [...items].sort((a, b) => b.strength - a.strength)
  const rankByCode = new Map(sorted.map((entry, index) => [entry.code, index + 1]))
  return items.map((item) => ({
    ...item,
    rankKey: rankKeyForPosition(rankByCode.get(item.code) ?? items.length, items.length),
  }))
}

function liveItemsToMockItems(
  live: Array<{ currency: string; strength: number; change: number; label?: string }>,
): CurrencyStrengthMockItem[] {
  const items = live.map((row) => ({
    code: row.currency,
    strength: row.strength,
    rankKey: row.label ?? "strength.neutral",
    series: buildStrengthSeries(row.strength, row.change),
  }))
  return assignRankKeys(items)
}

function resolveStrengthItems(
  api: CurrencyStrengthResponse | undefined,
  fallback: CurrencyStrengthMockItem[],
): {
  items: CurrencyStrengthMockItem[]
  unavailable: boolean
  coverage?: StrengthCoverage
} {
  if (!features.liveClientFetch) {
    clientDebug("CurrencyStrength", "live fetch disabled — static mock")
    return { items: fallback, unavailable: false }
  }

  if (api?.items?.length) {
    const items = liveItemsToMockItems(api.items)
    return {
      items,
      unavailable: items.length < STRENGTH_CURRENCY_COUNT,
      coverage: api.coverage,
    }
  }

  if (!api) {
    clientDebug("CurrencyStrength", "loading — no mock placeholder")
    return { items: [], unavailable: false }
  }

  return { items: [], unavailable: true, coverage: api.coverage }
}

function strengthBoxClass(rankKey: string, active: boolean) {
  const base =
    rankKey === "strength.strongest" || rankKey === "strength.veryStrong"
      ? "border-gain/40 bg-gain/15 text-gain"
      : rankKey === "strength.strong"
        ? "border-primary/40 bg-primary/10 text-primary"
        : rankKey === "strength.neutral"
          ? "border-border bg-secondary/40 text-foreground"
          : rankKey === "strength.weak"
            ? "border-warn/40 bg-warn/10 text-warn"
            : "border-loss/40 bg-loss/15 text-loss"
  return cn(base, !active && "opacity-40 saturate-50")
}

function formatStrengthTimestamp(iso: string | undefined, locale: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function strengthMetaLabel(
  t: (key: string) => string,
  lang: "vi" | "en",
  updatedAt?: string,
): string {
  const locale = lang === "vi" ? "vi-VN" : "en-US"
  const time = formatStrengthTimestamp(updatedAt, locale)
  const cadence = t("strength.updatesEvery5Min")
  if (!time) return cadence
  return `${t("strength.lastUpdated").replace("{time}", time)} · ${cadence}`
}

function strengthBarColor(rankKey: string): string {
  if (rankKey === "strength.strongest" || rankKey === "strength.veryStrong") {
    return "bg-gain"
  }
  if (rankKey === "strength.strong") return "bg-primary"
  if (rankKey === "strength.neutral") return "bg-muted-foreground/70"
  if (rankKey === "strength.weak") return "bg-warn"
  return "bg-loss"
}

type StrengthBarsProps = {
  visible: Set<string>
  items: CurrencyStrengthMockItem[]
}

function StrengthBars({ visible, items }: StrengthBarsProps) {
  const sorted = useMemo(
    () =>
      [...items]
        .filter((c) => visible.has(c.code))
        .sort((a, b) => b.strength - a.strength),
    [visible, items],
  )

  return (
    <div className="flex h-full flex-col justify-center gap-2.5 px-1 py-2">
      <div className="mb-1 flex items-center justify-between px-8 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>{STRENGTH_SCALE_MIN}</span>
        <span>{STRENGTH_NEUTRAL}</span>
        <span>{STRENGTH_SCALE_MAX}</span>
      </div>
      {sorted.map((c) => {
        const widthPct = Math.min(
          STRENGTH_SCALE_MAX,
          Math.max(STRENGTH_SCALE_MIN, c.strength),
        )
        return (
          <div
            key={c.code}
            className="grid grid-cols-[2.25rem_1fr_2.75rem] items-center gap-2"
          >
            <span className="text-[10px] font-bold text-foreground">{c.code}</span>
            <div className="relative h-3.5 rounded-full bg-secondary/50">
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-muted-foreground/40"
                style={{ left: `${STRENGTH_NEUTRAL}%` }}
                aria-hidden
              />
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-[width]",
                  strengthBarColor(c.rankKey),
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-semibold tabular-nums text-foreground">
              {c.strength.toFixed(1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function CurrencyStrength() {
  const { t, lang } = useLang()
  const strengthApi = useCurrencyStrength()
  const {
    items: currencyStrength,
    unavailable: dataUnavailable,
    coverage,
  } = useMemo(
    () => resolveStrengthItems(strengthApi.data, currencyStrengthFallback),
    [strengthApi.data],
  )
  const [visible, setVisible] = useState(
    () => new Set(currencyStrengthFallback.map((c) => c.code)),
  )

  const toggle = (code: string) => {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        if (next.size > 1) next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  const isLoading = strengthApi.isLoading && !strengthApi.data
  const hasFullStrengthSet = currencyStrength.length >= STRENGTH_CURRENCY_COUNT

  const showUnavailableMessage =
    !isLoading && currencyStrength.length < STRENGTH_CURRENCY_COUNT && dataUnavailable

  const coverageBadgeKey =
    coverage === "degraded"
      ? "strength.coverageDegraded"
      : coverage === "valid"
        ? "strength.coveragePartial"
        : null

  const metaLabel = strengthMetaLabel(t, lang, strengthApi.data?.updatedAt)

  return (
    <section aria-labelledby="currency-strength-title" className="h-[400px]">
      <div className="mb-1 flex items-center gap-2">
        <SectionHeading title={t("sec.currencyStrength1D")} />
        {coverageBadgeKey && currencyStrength.length > 0 && (
          <Badge variant="outline" className="text-[10px]">
            {t(coverageBadgeKey)}
          </Badge>
        )}
      </div>
      <Card className="h-[calc(100%-1.75rem)] border-border bg-card py-0">
        <CardContent className="flex h-full flex-col px-3 py-3">
          {showUnavailableMessage && (
            <p className="mb-2 text-xs text-muted-foreground">
              {t("error.currencyStrengthUnavailable")}
            </p>
          )}
          {hasFullStrengthSet && (
            <>
              <div className="mb-3 grid shrink-0 grid-cols-8 gap-2">
                {currencyStrength.map((c) => {
                  const active = visible.has(c.code)
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => toggle(c.code)}
                      className={cn(
                        "rounded-md border px-2 py-2 text-center transition-all hover:ring-1 hover:ring-primary/30",
                        strengthBoxClass(c.rankKey, active),
                      )}
                      aria-pressed={active}
                    >
                      <p className="text-[11px] font-bold">{c.code}</p>
                      <p className="mt-0.5 font-mono text-[10px] font-semibold tabular-nums">
                        {c.strength.toFixed(1)}
                      </p>
                      <p className="mt-0.5 text-[9px] font-medium leading-tight">
                        {t(c.rankKey)}
                      </p>
                    </button>
                  )
                })}
              </div>
              <div
                className="flex min-h-[220px] min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-chart-bg p-2"
                role="img"
                aria-label={t("sec.currencyStrength1D")}
              >
                <StrengthBars visible={visible} items={currencyStrength} />
              </div>
              <p className="mt-2 shrink-0 text-center text-[10px] text-muted-foreground">
                {metaLabel}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
