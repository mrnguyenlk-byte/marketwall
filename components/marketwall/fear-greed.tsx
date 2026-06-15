"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { fearGreed, fgLabel } from "@/lib/market-data"
import { SectionHeading } from "./shared"

// Semi-circular gauge (0-100). 180° arc from left to right.
function Gauge({ value }: { value: number }) {
  const r = 70
  const cx = 90
  const cy = 90
  const startAngle = 180
  const angle = startAngle - (value / 100) * 180
  const rad = (angle * Math.PI) / 180
  const nx = cx + r * Math.cos(rad)
  const ny = cy - r * Math.sin(rad)

  // colored segments
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

  return (
    <svg viewBox="0 0 180 108" className="w-full max-w-[180px]" aria-hidden>
      {segments.map((s, i) => (
        <path
          key={i}
          d={arc(s.from, s.to)}
          fill="none"
          stroke={s.color}
          strokeWidth="12"
          strokeLinecap="butt"
        />
      ))}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="var(--foreground)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="6" fill="var(--foreground)" />
      <circle cx={cx} cy={cy} r="3" fill="var(--background)" />
    </svg>
  )
}

export function FearGreed() {
  const { t } = useLang()

  return (
    <section aria-labelledby="fg-title">
      <SectionHeading title={t("sec.fearGreed")} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {fearGreed.map((g) => {
          const labelKey = fgLabel(g.value)
          return (
            <Card key={g.key}>
              <CardContent className="flex flex-col items-center px-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {t(g.key)}
                </p>
                <div className="relative">
                  <Gauge value={g.value} />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
                    <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                      {g.value}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {t(labelKey)}
                </p>
                <div className="mt-2 flex w-full justify-between text-[10px] text-muted-foreground">
                  <span>{t("fg.extremeFear")}</span>
                  <span>{t("fg.extremeGreed")}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
