"use client"

import Link from "next/link"
import { useLang } from "@/lib/i18n"
import { getLegalPage, type LegalSlug, legalPages } from "@/lib/legal-content"

export function LegalPageContent({ slug }: { slug: LegalSlug }) {
  const { lang, t } = useLang()
  const page = getLegalPage(slug)

  const otherPages = (Object.keys(legalPages) as LegalSlug[]).filter((s) => s !== slug)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2 border-b border-border/60 pb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("footer.legal")}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{page.title[lang]}</h1>
        <p className="text-xs text-muted-foreground">{page.lastUpdated[lang]}</p>
      </header>

      <div className="space-y-6">
        {page.sections.map((section, i) => (
          <section key={i} className="space-y-3">
            {section.heading && (
              <h2 className="text-sm font-semibold text-foreground">{section.heading[lang]}</h2>
            )}
            {section.paragraphs.map((p, j) => (
              <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                {p[lang]}
              </p>
            ))}
          </section>
        ))}
      </div>

      <aside className="rounded-lg border border-border/80 bg-card/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {t("legal.related")}
        </p>
        <ul className="mt-3 space-y-2">
          {otherPages.map((s) => (
            <li key={s}>
              <Link
                href={`/legal/${s}`}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {legalPages[s].title[lang]}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
