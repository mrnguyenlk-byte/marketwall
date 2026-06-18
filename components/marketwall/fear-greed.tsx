"use client"

import { useLang } from "@/lib/i18n"
import { fgLabel, type FearGreedItem } from "@/lib/fear-greed"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DashboardCard, SectionHeading } from "./shared"

function sentimentTone(value: number) {
  if (value <= 20) return "loss"
  if (value <= 40) return "warn"
  if (value <= 60) return "neutral"
  if (value <= 80) return "gain"
  return "gain"
}

function sentimentColor(value: number) {
  const tone = sentimentTone(value)
  if (tone === "loss") return "var(--loss)"
  if (tone === "warn") return "var(--warn)"
  if (tone === "neutral") return "var(--neutral)"
  return "var(--gain)"
}

function Gauge({ value, compact = false }: { value: number; compact?: boolean }) {
  const r = compact ? 36 : 44
  const cx = 60
  const cy = compact ? 46 : 50
  const angle = 180 - (value / 100) * 180
  const rad = (angle * Math.PI) / 180
  const nx = cx + r * Math.cos(rad)
  const ny = cy - r * Math.sin(rad)

  const segments = [
    { from: 0, to: 20, color: "var(--loss)" },
    { from: 20, to: 40, color: "var(--warn)" },
    { from: 40, to: 60, color: "var(--neutral)" },
    { from: 60, to: 80, color: "#7cb342" },
    { from: 80, to: 100, color: "var(--gain)" },
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
    <svg
      viewBox="0 0 120 54"
      className={cn("mx-auto w-full max-w-[120px]", compact ? "h-[44px]" : "h-[56px]")}
      aria-hidden
    >
      {segments.map((s, i) => (
        <path
          key={i}
          d={arc(s.from, s.to)}
          fill="none"
          stroke={s.color}
          strokeWidth="7"
          strokeLinecap="butt"
        />
      ))}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={needleColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3" fill={needleColor} />
    </svg>
  )
}

function FearGreedCell({
  item,
  compact,
}: {
  item: FearGreedItem
  compact: boolean
}) {
  const { t, lang } = useLang()
  const labelKey = fgLabel(item.value)
  const tone = sentimentTone(item.value)
  const reasons = item.reasons ?? []
  const reasonText = reasons.map((r) => (lang === "vi" ? r.vi : r.en))

  const labelBlock = (
    <p
      className={cn(
        "font-semibold",
        compact ? "mt-0.5 text-[10px]" : "mt-1 text-xs",
        tone === "loss" && "text-loss",
        tone === "warn" && "text-warn",
        tone === "neutral" && "text-muted-foreground",
        tone === "gain" && "text-gain",
        reasons.length > 0 && "cursor-help underline decoration-dotted underline-offset-2",
      )}
    >
      {t(labelKey)}
    </p>
  )

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border-r border-border last:border-r-0",
        compact ? "px-1.5 py-1" : "px-3 py-2",
      )}
    >
      <div
        className={cn(
          "flex w-full min-h-[28px] items-center justify-center px-1",
          !compact && "min-h-[32px]",
        )}
      >
        <p
          className={cn(
            "type-secondary-label text-center text-balance font-semibold leading-tight text-foreground line-clamp-2",
            !compact && "type-table",
          )}
        >
          {t(item.key)}
        </p>
      </div>
      <div className="relative w-full py-0.5">
        <Gauge value={item.value} compact={compact} />
        <span
          className={cn(
            "absolute inset-x-0 bottom-0 text-center font-mono type-metric tabular-nums",
            compact ? "text-base" : "text-xl",
            tone === "loss" && "text-loss",
            tone === "warn" && "text-warn",
            tone === "neutral" && "text-foreground",
            tone === "gain" && "text-gain",
          )}
        >
          {item.value}
        </span>
      </div>
      {reasons.length > 0 ? (
        <Tooltip>
          <TooltipTrigger render={<div className="w-full text-center">{labelBlock}</div>} />
          <TooltipContent side="bottom" className="max-w-xs space-y-1 text-xs">
            {reasonText.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </TooltipContent>
        </Tooltip>
      ) : (
        labelBlock
      )}
    </div>
  )
}

export function FearGreed({
  items,
  variant = "default",
}: {
  items: FearGreedItem[]
  variant?: "default" | "sidebar"
}) {
  const { t } = useLang()
  const compact = variant === "sidebar"

  return (
    <section aria-labelledby="fg-title" className={cn("min-w-0", compact ? "h-[220px]" : "h-[200px]")}>
      <SectionHeading id="fg-title" title={t("sec.fearGreed")} />
      <TooltipProvider delay={200}>
        <DashboardCard
          className={cn(
            "grid grid-cols-3 gap-0 ring-0",
            compact ? "h-[188px]" : "h-[172px]",
          )}
        >
          {items.map((g) => (
            <FearGreedCell key={g.key} item={g} compact={compact} />
          ))}
        </DashboardCard>
      </TooltipProvider>
    </section>
  )
}
