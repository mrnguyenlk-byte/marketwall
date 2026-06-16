"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeft, ExternalLink } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import type { BrokerComparisonResult } from "@/types/broker"
import { cn } from "@/lib/utils"

function CompareCell({
  value,
  highlight,
  side,
}: {
  value: string
  highlight: "left" | "right" | "tie" | null
  side: "left" | "right"
}) {
  const active =
    highlight === side || (highlight === "tie" && side === "left")
  return (
    <td
      className={cn(
        "px-3 py-2.5 text-sm text-foreground",
        active && highlight !== "tie" && "font-semibold text-primary",
        highlight === "tie" && "text-muted-foreground",
      )}
    >
      {value}
    </td>
  )
}

export function BrokerComparePage({ comparison }: { comparison: BrokerComparisonResult }) {
  const { t } = useLang()
  const { left, right, rows, scoreLeft, scoreRight } = comparison

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/brokers"
          className="inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-medium text-primary transition-colors hover:bg-secondary/60"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("sec.brokers")}
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
          {left.name} {t("brokers.compare.vs")} {right.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("brokers.compare.title")}</p>
      </header>

      <Card className="overflow-hidden border-border/80 py-0 shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border bg-secondary/30">
            <div className="px-4 py-3 text-center">
              <p className="text-sm font-bold text-foreground">{left.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("brokers.filter.rating")}: {left.rating.toFixed(1)}
              </p>
              <a
                href={`/api/brokers/redirect?slug=${encodeURIComponent(left.slug)}&source=compare`}
                className="mt-2 inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="size-3" aria-hidden />
                {t("misc.visitBroker")}
              </a>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-sm font-bold text-foreground">{right.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("brokers.filter.rating")}: {right.rating.toFixed(1)}
              </p>
              <a
                href={`/api/brokers/redirect?slug=${encodeURIComponent(right.slug)}&source=compare`}
                className="mt-2 inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="size-3" aria-hidden />
                {t("misc.visitBroker")}
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("brokers.compare.metric")}
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-foreground">{left.name}</th>
                  <th className="px-3 py-2 text-xs font-semibold text-foreground">{right.name}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{t(row.labelKey)}</td>
                    <CompareCell value={row.left} highlight={row.highlight} side="left" />
                    <CompareCell value={row.right} highlight={row.highlight} side="right" />
                  </tr>
                ))}
                <tr className="bg-secondary/20">
                  <td className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                    {t("brokers.compare.score")}
                  </td>
                  <td className="px-3 py-2.5 text-sm font-bold text-foreground">{scoreLeft}</td>
                  <td className="px-3 py-2.5 text-sm font-bold text-foreground">{scoreRight}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 ring-1 ring-warn/20">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
        <p className="text-sm leading-relaxed text-warn/90">{t("broker.disclaimer")}</p>
      </div>
    </div>
  )
}
