"use client"

import Link from "next/link"
import { BrandLogo } from "./brand-logo"
import { useLang } from "@/lib/i18n"
import { SITE_NAME } from "@/lib/brand"

const COMPANY_LINKS = [
  { key: "footer.about", href: "/contact" },
  { key: "footer.contact", href: "/contact" },
  { key: "footer.advertise", href: "/contact" },
  { key: "footer.careers", href: "/contact" },
] as const

const LEGAL_LINKS = [
  { key: "footer.terms", href: "/legal/terms" },
  { key: "footer.privacy", href: "/legal/privacy" },
  { key: "footer.cookie", href: "/legal/cookies" },
  { key: "footer.risk", href: "/legal/risk-disclosure" },
  { key: "footer.disclaimer", href: "/legal/disclaimer" },
  { key: "footer.partnerDisclosure", href: "/legal/partner-disclosure" },
] as const

export function Footer() {
  const { t } = useLang()

  return (
    <footer className="border-t border-border/80 bg-card/60">
      <div className="w-full px-4 py-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <BrandLogo height={52} />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2">
              {COMPANY_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2">
              {LEGAL_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
          <p className="text-[11px] text-muted-foreground">© 2026 {SITE_NAME}</p>
          <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
            {t("footer.disclaimerLine")}
          </p>
        </div>
      </div>
    </footer>
  )
}
