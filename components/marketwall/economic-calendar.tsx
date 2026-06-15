"use client"

import { CalendarDays } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/lib/i18n"
import { calendar } from "@/lib/market-data"
import { SectionHeading } from "./shared"
import { cn } from "@/lib/utils"

function ImpactDots({ level }: { level: "high" | "medium" | "low" }) {
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1
  const color =
    level === "high" ? "bg-loss" : level === "medium" ? "bg-warn" : "bg-neutral"
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={level}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full",
            i < filled ? color : "bg-muted",
          )}
        />
      ))}
    </span>
  )
}

export function EconomicCalendar() {
  const { t, lang } = useLang()

  return (
    <section aria-labelledby="calendar-title" className="h-full">
      <SectionHeading
        title={t("sec.calendar")}
        badge={
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <CalendarDays className="size-3" /> {t("misc.today")}
          </Badge>
        }
      />
      <Card className="h-[calc(100%-2.25rem)] py-0">
        <CardContent className="px-0">
          <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 border-b border-border px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span>{t("label.time")}</span>
            <span>{t("label.event")}</span>
            <span className="text-right">{t("label.actual")}</span>
            <span className="text-right">{t("label.forecast")}</span>
            <span className="text-right">{t("label.previous")}</span>
          </div>
          <ul className="divide-y divide-border">
            {calendar.map((e, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm transition-colors hover:bg-secondary/40 sm:grid-cols-[auto_1fr_auto_auto_auto]"
              >
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {e.time}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-base leading-none" aria-hidden>
                    {e.flag}
                  </span>
                  <span className="truncate text-foreground">
                    {e.event[lang]}
                  </span>
                  <ImpactDots level={e.impact} />
                </span>
                <span className="col-start-2 flex gap-3 font-mono text-xs tabular-nums sm:col-start-3 sm:block sm:text-right sm:text-foreground">
                  <span className="text-foreground sm:hidden">A:</span>
                  {e.actual}
                </span>
                <span className="hidden text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
                  {e.forecast}
                </span>
                <span className="hidden text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
                  {e.previous}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
