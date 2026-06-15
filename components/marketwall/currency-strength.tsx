"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { currencyStrength } from "@/lib/market-data"
import { SectionHeading } from "./shared"
import { cn } from "@/lib/utils"

const CHART_W = 640
const CHART_H = 260
const PAD = { top: 12, right: 12, bottom: 24, left: 36 }

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

function strengthBoxClass(rankKey: string) {
  if (rankKey === "strength.strongest" || rankKey === "strength.veryStrong")
    return "border-gain/40 bg-gain/15 text-gain"
  if (rankKey === "strength.strong") return "border-primary/40 bg-primary/10 text-primary"
  if (rankKey === "strength.neutral") return "border-border bg-secondary/40 text-foreground"
  if (rankKey === "strength.weak") return "border-warn/40 bg-warn/10 text-warn"
  return "border-loss/40 bg-loss/15 text-loss"
}

function StrengthChart() {
  const plotW = CHART_W - PAD.left - PAD.right
  const plotH = CHART_H - PAD.top - PAD.bottom
  const allValues = currencyStrength.flatMap((c) => c.series)
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
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
          />
        )
      })}
      {currencyStrength.map((c, ci) => {
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

export function CurrencyStrength() {
  const { t } = useLang()

  return (
    <section aria-labelledby="currency-strength-title">
      <SectionHeading title={t("sec.currencyStrength1D")} />
      <Card className="border-border/80 py-0 shadow-sm">
        <CardContent className="px-3 py-2">
          <div className="mb-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-9">
            {currencyStrength.map((c) => (
              <div
                key={c.code}
                className={cn(
                  "rounded-md border px-2 py-1 text-center",
                  strengthBoxClass(c.rankKey),
                )}
              >
                <p className="text-xs font-bold">{c.code}</p>
                <p className="mt-0.5 font-mono text-[11px] font-semibold tabular-nums">
                  {c.changePercent >= 0 ? "+" : ""}
                  {c.strength.toFixed(1)}
                </p>
                <p className="mt-0.5 text-[10px] font-medium leading-tight">
                  {t(c.rankKey)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-[#0a0e14]/60 p-1">
              <div className="h-[260px] w-full">
                <StrengthChart />
              </div>
            </div>
            <div className="hidden w-[72px] shrink-0 flex-col justify-center gap-1.5 sm:flex">
              {currencyStrength.map((c, i) => (
                <div
                  key={c.code}
                  className="flex items-center gap-1.5 text-[10px] leading-tight"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate font-mono tabular-nums text-muted-foreground">
                    {c.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
