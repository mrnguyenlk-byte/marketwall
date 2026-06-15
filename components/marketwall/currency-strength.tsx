"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { getData } from "@/lib/providers/currency-provider"

const { items: currencyStrength, chartMeta: currencyStrengthChartMeta } = getData()
import { SectionHeading } from "./shared"
import { cn } from "@/lib/utils"

const CHART_W = 720
const CHART_H = 228
const PAD = { top: 12, right: 8, bottom: 8, left: 40 }

const LINE_COLORS = [
  "var(--gain)",
  "#22d3ee",
  "var(--primary)",
  "#a78bfa",
  "#f472b6",
  "#38bdf8",
  "#fb923c",
  "#4ade80",
  "#f87171",
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
}

function StrengthChart({ visible }: StrengthChartProps) {
  const plotW = CHART_W - PAD.left - PAD.right
  const plotH = CHART_H - PAD.top - PAD.bottom
  const visibleItems = currencyStrength.filter((c) => visible.has(c.code))
  const allValues = visibleItems.flatMap((c) => c.series)
  const min = allValues.length ? Math.min(...allValues) : 0
  const max = allValues.length ? Math.max(...allValues) : 1
  const range = max - min || 1

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = PAD.top + plotH * pct
        return (
          <line
            key={pct}
            x1={PAD.left}
            y1={y}
            x2={CHART_W - PAD.right}
            y2={y}
            stroke="var(--border)"
            strokeOpacity={0.5}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}

      {currencyStrengthChartMeta.timeLabels.map((label, i) => {
        const x =
          PAD.left + (i / (currencyStrengthChartMeta.timeLabels.length - 1)) * plotW
        return (
          <line
            key={label}
            x1={x}
            y1={PAD.top}
            x2={x}
            y2={PAD.top + plotH}
            stroke="var(--border)"
            strokeOpacity={0.25}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}

      {currencyStrength.map((c, ci) => {
        if (!visible.has(c.code)) return null
        const step = plotW / (c.series.length - 1)
        const points = c.series
          .map((v, i) => {
            const x = PAD.left + i * step
            const y = PAD.top + plotH - ((v - min) / range) * plotH
            return `${x.toFixed(1)},${y.toFixed(1)}`
          })
          .join(" ")
        return (
          <polyline
            key={c.code}
            points={points}
            fill="none"
            stroke={LINE_COLORS[ci % LINE_COLORS.length]}
            strokeWidth={c.code === "VND" ? 2.5 : 2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
    </svg>
  )
}

function TimeAxis() {
  const { timezone, timeLabels } = currencyStrengthChartMeta
  const leftPct = `${(PAD.left / CHART_W) * 100}%`
  const rightPct = `${(PAD.right / CHART_W) * 100}%`

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
}

function StrengthLegend({ visible, onToggle }: LegendProps) {
  const { t } = useLang()

  return (
    <div className="flex w-[100px] shrink-0 flex-col border-l border-border/60 pl-2.5">
      <div className="mb-2 grid grid-cols-[1fr_auto] gap-x-1 border-b border-border/50 pb-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{t("label.currency")}</span>
        <span className="text-right">{t("label.strength")}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1">
        {currencyStrength.map((c, i) => {
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
  const [visible, setVisible] = useState(
    () => new Set(currencyStrength.map((c) => c.code)),
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

  return (
    <section aria-labelledby="currency-strength-title" className="h-[400px]">
      <SectionHeading title={t("sec.currencyStrength1D")} />
      <Card className="h-[calc(100%-1.75rem)] border-border bg-card py-0">
        <CardContent className="flex h-full flex-col px-3 py-3">
          <div className="mb-3 grid shrink-0 grid-cols-9 gap-2">
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
                <StrengthChart visible={visible} />
              </div>
              <TimeAxis />
            </div>
            <StrengthLegend visible={visible} onToggle={toggle} />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
