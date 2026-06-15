"use client"

import { AlertTriangle } from "lucide-react"
import { useLang } from "@/lib/i18n"

export function RiskWarning() {
  const { t } = useLang()
  return (
    <section
      aria-labelledby="risk-title"
      className="rounded-lg border border-warn/30 bg-warn/5 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-warn/15 text-warn">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div className="space-y-2">
          <h2
            id="risk-title"
            className="text-sm font-semibold uppercase tracking-wide text-warn"
          >
            {t("risk.title")}
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("risk.body")}
          </p>
          <div className="pt-1">
            <p className="text-xs font-semibold text-foreground">
              {t("risk.disclaimer")}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("risk.disclaimerBody")}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
