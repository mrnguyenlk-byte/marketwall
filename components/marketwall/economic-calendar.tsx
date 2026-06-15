"use client"



import { useEffect, useState } from "react"

import { CalendarDays } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { useLang } from "@/lib/i18n"

import type { EconomicEvent } from "@/lib/market-data"

import { CalendarListSkeleton } from "./data-skeletons"

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



type CalendarApiResponse = {

  source?: "live" | "mock"

  uiEvents?: EconomicEvent[]

}



export function EconomicCalendar({ fallbackEvents }: { fallbackEvents: EconomicEvent[] }) {

  const { t, lang } = useLang()

  const [events, setEvents] = useState<EconomicEvent[]>(fallbackEvents)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadCalendar() {

      setLoading(true)

      try {

        const res = await fetch("/api/calendar", { cache: "no-store" })

        if (!res.ok) {

          if (!cancelled) setEvents(fallbackEvents)

          return

        }

        const data = (await res.json()) as CalendarApiResponse

        if (!cancelled && data.uiEvents?.length) {

          setEvents(data.uiEvents)

        }

      } catch {

        if (!cancelled) setEvents(fallbackEvents)

      } finally {

        if (!cancelled) setLoading(false)

      }

    }



    loadCalendar()

    return () => {

      cancelled = true

    }

  }, [fallbackEvents])



  return (

    <section aria-labelledby="calendar-title" className="flex h-[320px] flex-col">

      <SectionHeading

        title={t("sec.calendar")}

        badge={

          <Badge variant="secondary" className="gap-1 text-[10px]">

            <CalendarDays className="size-3" /> {t("misc.today")}

          </Badge>

        }

      />

      <Card className="min-h-0 flex-1 border-border bg-card py-0">

        <CardContent className="px-0">

          <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 border-b border-border px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">

            <span>{t("label.time")}</span>

            <span>{t("label.event")}</span>

            <span className="text-right">{t("label.actual")}</span>

            <span className="text-right">{t("label.forecast")}</span>

            <span className="text-right">{t("label.previous")}</span>

          </div>

          {loading ? (

            <CalendarListSkeleton count={fallbackEvents.length || 5} />

          ) : (

            <ul className="divide-y divide-border">

              {events.map((e) => (

                <li

                  key={e.id}

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

          )}

        </CardContent>

      </Card>

    </section>

  )

}


