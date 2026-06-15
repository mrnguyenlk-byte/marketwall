"use client"

import { useLang } from "@/lib/i18n"
import { fearGreedData, fgLabel } from "@/lib/market-data"
import { cn } from "@/lib/utils"

function sentimentTone(value: number) {
  if (value < 25) return "loss"
  if (value < 45) return "warn"
  if (value < 55) return "neutral"
  if (value < 75) return "gain"
  return "gain"
}

function sentimentColor(value: number) {
  const tone = sentimentTone(value)
  if (tone === "loss") return "var(--loss)"
  if (tone === "warn") return "var(--warn)"
  if (tone === "neutral") return "var(--neutral)"
  return "var(--gain)"
}

function Gauge({ value }: { value: number }) {
  const r = 24
  const cx = 36
  const cy = 30
  const angle = 180 - (value / 100) * 180
  const rad = (angle * Math.PI) / 180
  const nx = cx + r * Math.cos(rad)
  const ny = cy - r * Math.sin(rad)

  const segments = [
    { from: 0, to: 25, color: "var(--loss)" },
    { from: 25, to: 45, color: "var(--warn)" },
    { from: 45, to: 55, color: "var(--neutral)" },
    { from: 55, to: 75, color: "color-mix(in oklch, var(--gain) 70%, var(--warn))" },
    { from: 75, to: 100, color: "var(--gain)" },
  ]

  function arc(from: number, to: number) {
    const a1 = ((180 - (from / 100) * 180) * Math.PI) / 180
    const a2 = ((180 - (to / 100) * 180) * Math.PI) / 180
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy - r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2)
    const y2 = cy - r * Math.sin(a2)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }

  const needleColor = sentimentColor(value)

  return (
    <svg viewBox="0 0 72 36" className="mx-auto h-[28px] w-full max-w-[60px]" aria-hidden>
      {segments.map((s, i) => (
        <path
          key={i}
          d={arc(s.from, s.to)}
          fill="none"
          stroke={s.color}
          strokeWidth="4"
          strokeLinecap="butt"
        />
      ))}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={needleColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="1.75" fill={needleColor} />
    </svg>
  )
}

export function FearGreed() {
  const { t } = useLang()

  return (
    <section aria-labelledby="fg-title" className="max-h-[130px] overflow-hidden">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-3.5 w-0.5 rounded-full bg-primary" aria-hidden />
        <h2
          id="fg-title"
          className="text-xs font-semibold tracking-tight text-foreground sm:text-sm"
        >
          {t("sec.fearGreed")}
        </h2>
      </div>
      <div className="grid h-[108px] grid-cols-3 gap-0 rounded-lg border border-border bg-gradient-to-b from-card/90 to-card/60">
        {fearGreedData.map((g) => {
          const labelKey = fgLabel(g.value)
          const tone = sentimentTone(g.value)
          return (
            <div
              key={g.key}
              className="flex min-w-0 flex-col items-center justify-center border-r border-border/80 px-1.5 py-1 last:border-r-0"
            >
              <p className="mb-0.5 w-full truncate text-center text-[10px] font-semibold leading-tight text-foreground">
                {t(g.key)}
              </p>
              <div className="relative w-full">
                <Gauge value={g.value} />
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 text-center font-mono text-xs font-bold tabular-nums leading-none",
                    tone === "loss" && "text-loss",
                    tone === "warn" && "text-warn",
                    tone === "neutral" && "text-foreground",
                    tone === "gain" && "text-gain",
                  )}
                >
                  {g.value}
                </span>
              </div>
              <p
                className={cn(
                  "mt-0.5 truncate text-[9px] font-semibold leading-tight",
                  tone === "loss" && "text-loss",
                  tone === "warn" && "text-warn",
                  tone === "neutral" && "text-muted-foreground",
                  tone === "gain" && "text-gain",
                )}
              >
                {t(labelKey)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
