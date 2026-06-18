"use client"

import Link from "next/link"
import { AlertTriangle, ArrowUpRight } from "lucide-react"
import { useLang } from "@/lib/i18n"
import { TELEGRAM_LINK } from "@/lib/contact"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const BULLET_KEYS = [
  "dailyAnalysis.hero.bullet1",
  "dailyAnalysis.hero.bullet2",
  "dailyAnalysis.hero.bullet3",
] as const

export function DailyAnalysisHero() {
  const { t } = useLang()

  return (
    <section
      aria-labelledby="daily-analysis-hero-title"
      className="relative overflow-hidden rounded-lg border border-warn/40 bg-gradient-to-br from-warn/10 via-card to-primary/5 p-4 shadow-sm ring-1 ring-warn/20 sm:p-5 lg:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-warn/10 blur-2xl"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warn/20 text-warn sm:size-11">
          <AlertTriangle className="size-5 sm:size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <h2
              id="daily-analysis-hero-title"
              className="text-base font-bold leading-snug text-foreground sm:text-lg lg:text-xl"
            >
              {t("dailyAnalysis.hero.title")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {t("dailyAnalysis.hero.body")}
            </p>
          </div>
          <div className="rounded-md border border-border/60 bg-card/50 px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-warn sm:text-[13px]">
              {t("dailyAnalysis.hero.earlyDetection")}
            </p>
            <ul className="mt-2 space-y-1.5">
              {BULLET_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span className="leading-relaxed">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href={TELEGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-9 w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto",
            )}
          >
            {t("dailyAnalysis.hero.cta")}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
