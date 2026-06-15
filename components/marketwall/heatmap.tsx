"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/lib/i18n"
import {
  usHeatmap,
  vnHeatmap,
  cryptoHeatmap,
  type HeatTile,
} from "@/lib/market-data"
import { SectionHeading, heatStyle } from "./shared"
import { cn } from "@/lib/utils"

function span(weight: number) {
  if (weight >= 10) return "col-span-2 row-span-2"
  if (weight >= 6) return "col-span-2 row-span-1"
  return "col-span-1 row-span-1"
}

function HeatGrid({ tiles }: { tiles: HeatTile[] }) {
  const { lang } = useLang()
  return (
    <div className="grid auto-rows-[52px] grid-cols-4 gap-1 sm:grid-cols-6">
      {tiles.map((tile) => {
        const up = tile.changePct >= 0
        return (
          <button
            key={tile.symbol}
            style={heatStyle(tile.changePct)}
            className={cn(
              "flex flex-col items-center justify-center rounded-md p-1 text-center ring-1 ring-inset ring-white/5 transition-transform hover:scale-[1.03] hover:ring-white/20",
              span(tile.weight),
            )}
            title={`${tile.name[lang]} ${up ? "+" : ""}${tile.changePct.toFixed(2)}%`}
          >
            <span className="text-xs font-bold leading-tight text-white drop-shadow">
              {tile.symbol}
            </span>
            <span className="font-mono text-[11px] font-medium tabular-nums text-white/90">
              {up ? "+" : ""}
              {tile.changePct.toFixed(2)}%
            </span>
          </button>
        )
      })}
    </div>
  )
}

const tabs = [
  { id: "us", titleKey: "sec.usHeatmap", flag: "🇺🇸", data: usHeatmap },
  { id: "vn", titleKey: "sec.vnHeatmap", flag: "🇻🇳", data: vnHeatmap },
  { id: "crypto", titleKey: "sec.cryptoHeatmap", flag: "₿", data: cryptoHeatmap },
] as const

export function HeatmapSection() {
  const { t } = useLang()
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("us")
  const current = tabs.find((tb) => tb.id === active)!

  return (
    <section aria-labelledby="heatmap-title">
      <SectionHeading
        title={t(current.titleKey)}
        badge={
          <Badge variant="secondary" className="gap-1 text-[10px]">
            {t("label.weighted")}
          </Badge>
        }
        action={
          <div className="flex items-center gap-1 rounded-md bg-secondary/60 p-0.5">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setActive(tb.id)}
                className={cn(
                  "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  active === tb.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span aria-hidden>{tb.flag}</span>
                <span className="hidden sm:inline">{tb.id.toUpperCase()}</span>
              </button>
            ))}
          </div>
        }
      />
      <Card>
        <CardContent>
          <HeatGrid tiles={current.data} />
          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-loss" /> -3%
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-neutral/60" /> 0%
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-gain" /> +3%
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
