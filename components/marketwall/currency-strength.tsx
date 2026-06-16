"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { clientDebug, features } from "@/lib/config/features"
import { buildStrengthSeries } from "@/lib/currency-strength/calculate-strength"
import { useLang } from "@/lib/i18n"
import {
  currencyStrengthChartMeta,
  currencyStrengthItems as currencyStrengthFallback,
  type CurrencyStrengthMockItem,
} from "@/lib/currency-strength-mock"
import {
  useCurrencyStrength,
  type CurrencyStrengthResponse,
} from "@/hooks/useCurrencyStrength"
import { LightweightChart, pointsFromValues } from "./lightweight-chart"
import { SectionHeading } from "./shared"
import { cn } from "@/lib/utils"

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
): { items: CurrencyStrengthMockItem[]; unavailable: boolean } {
  if (!features.liveClientFetch) {
    clientDebug("CurrencyStrength", "live fetch disabled — static mock")
    return { items: fallback, unavailable: false }
  }

  if (api?.unavailable) {
    return { items: [], unavailable: true }
  }

  if (api?.source === "live" && api.items?.length) {
    clientDebug("CurrencyStrength", "using live API data")
    return { items: liveItemsToMockItems(api.items), unavailable: false }
  }

  if (!api) {
    clientDebug("CurrencyStrength", "loading — no mock placeholder")
    return { items: [], unavailable: false }
  }

  if (api.source === "mock" && api.items?.length) {
    clientDebug("CurrencyStrength", "explicit mock fallback from API")
    return { items: liveItemsToMockItems(api.items), unavailable: true }
  }

  if (api.fallback) {
    return { items: [], unavailable: true }
  }

  return { items: [], unavailable: false }
}

const LINE_COLORS = [
  "var(--gain)",
  "#22d3ee",
  "var(--primary)",
  "#a78bfa",
  "#f472b6",
  "#38bdf8",
  "#fb923c",
  "#4ade80",
]

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

type StrengthChartProps = {
  visible: Set<string>
  items: CurrencyStrengthMockItem[]
}

function StrengthChart({ visible, items }: StrengthChartProps) {
  const series = useMemo(
    () =>
      items
        .map((c, ci) => ({ c, ci }))
        .filter(({ c }) => visible.has(c.code))
        .map(({ c, ci }) => ({
          data: pointsFromValues(c.series),
          color: LINE_COLORS[ci % LINE_COLORS.length],
          lineWidth: 2,
        })),
    [visible, items],
  )

  return (
    <LightweightChart
      series={series}
      height={228}
      showTimeScale={false}
      showGrid
      className="h-full"
    />
  )
}

function TimeAxis() {
  const { timezone, timeLabels } = currencyStrengthChartMeta
  const leftPct = "5.5%"
  const rightPct = "1.1%"

  return (
    <div className="shrink-0 border-t border-border/50 pt-1.5">
      <div
        className="grid items-center gap-0"
        style={{
          paddingLeft: leftPct,
          paddingRight: rightPct,
          gridTemplateColumns: `auto repeat(${timeLabels.length}, 1fr)`,
        }}
      >
        <span className="w-8 pr-1 text-[9px] font-medium text-muted-foreground">
          {timezone}
        </span>
        {timeLabels.map((label) => (
          <span
            key={label}
            className="text-center font-mono text-[10px] tabular-nums text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

type LegendProps = {
  visible: Set<string>
  onToggle: (code: string) => void
  items: CurrencyStrengthMockItem[]
}

function StrengthLegend({ visible, onToggle, items }: LegendProps) {
  const { t } = useLang()

  return (
    <div className="flex w-[100px] shrink-0 flex-col border-l border-border/60 pl-2.5">
      <div className="mb-2 grid grid-cols-[1fr_auto] gap-x-1 border-b border-border/50 pb-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{t("label.currency")}</span>
        <span className="text-right">{t("label.strength")}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1">
        {items.map((c, i) => {
          const active = visible.has(c.code)
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => onToggle(c.code)}
              className={cn(
                "grid w-full grid-cols-[auto_1fr_auto] items-center gap-1 rounded px-0.5 py-0.5 text-left text-[10px] transition-opacity hover:bg-secondary/40",
                !active && "opacity-40",
              )}
              aria-pressed={active}
              title={active ? t("action.hideLine") : t("action.showLine")}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
              />
              <span className="truncate font-medium text-foreground">{c.code}</span>
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {c.strength.toFixed(1)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CurrencyStrength() {
  const { t } = useLang()
  const strengthApi = useCurrencyStrength()
  const { items: currencyStrength, unavailable: dataUnavailable } = useMemo(
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

  const showUnavailableMessage =
    dataUnavailable || Boolean(strengthApi.error)

  return (
    <section aria-labelledby="currency-strength-title" className="h-[400px]">
      <SectionHeading title={t("sec.currencyStrength1D")} />
      <Card className="h-[calc(100%-1.75rem)] border-border bg-card py-0">
        <CardContent className="flex h-full flex-col px-3 py-3">
          {showUnavailableMessage && (
            <p className="mb-2 text-xs text-muted-foreground">
              {t("error.currencyStrengthUnavailable")}
            </p>
          )}
          {currencyStrength.length > 0 && (
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
              <div className="flex min-h-0 flex-1 gap-2">
                <div
                  className="flex min-h-[260px] min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-chart-bg p-1.5"
                  role="img"
                  aria-label={t("sec.currencyStrength1D")}
                >
                  <div className="min-h-0 flex-1">
                    <StrengthChart visible={visible} items={currencyStrength} />
                  </div>
                  <TimeAxis />
                </div>
                <StrengthLegend visible={visible} onToggle={toggle} items={currencyStrength} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
