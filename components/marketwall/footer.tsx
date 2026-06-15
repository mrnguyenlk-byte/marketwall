"use client"

import { TrendingUp } from "lucide-react"
import { useLang } from "@/lib/i18n"

export function Footer() {
  const { t } = useLang()

  const companyLinks = [
    "footer.about",
    "footer.contact",
    "footer.advertise",
    "footer.dataPartners",
  ]
  const legalLinks = [
    "footer.risk",
    "footer.terms",
    "footer.privacy",
    "footer.cookie",
    "footer.disclaimer",
  ]

  return (
    <footer className="border-t border-border/80 bg-card/60">
      <div className="w-full px-3 py-5 lg:px-4">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <TrendingUp className="size-5" aria-hidden />
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Market<span className="text-primary">Wall</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2">
              {companyLinks.map((k) => (
                <li key={k}>
                  <a
                    href="#"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(k)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((k) => (
                <li key={k}>
                  <a
                    href="#"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(k)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("nav.markets")}
            </h3>
            <ul className="space-y-2">
              {["misc.indices", "misc.commodities", "misc.crypto", "misc.currencies"].map(
                (k) => (
                  <li key={k}>
                    <a
                      href="#"
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(k)}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-1.5 border-t border-border/60 pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} MarketWall. {t("footer.rights")}
          </p>
          <p className="max-w-2xl text-[11px] leading-relaxed">
            {t("misc.delayed")} · {t("footer.disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  )
}
