"use client"

import { Search } from "lucide-react"
import { usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { BrandLogo } from "./brand-logo"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"
import { AuthButtons } from "./auth-buttons"
import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const NAV_ITEMS: { key: string; href: string; match?: string }[] = [
  { key: "nav.dashboard", href: "/" },
  { key: "nav.brokers", href: "/brokers", match: "/brokers" },
  { key: "nav.contact", href: "/contact", match: "/contact" },
]

export function Header() {
  const { t } = useLang()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="grid h-20 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-8 lg:px-12">
        <div className="flex items-center pl-5">
          <BrandLogo height={76} priority />
        </div>

        <div className="relative hidden w-full min-w-[300px] max-w-2xl md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("action.searchFull")}
            aria-label={t("action.searchFull")}
            className="h-9 w-full rounded-lg border-border bg-surface-muted pl-9 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pr-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <AuthButtons />
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex h-10 items-center justify-center gap-0.5 border-t border-border/80 px-8 lg:px-12"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.match
            ? pathname === item.match
            : item.href === "/" && pathname === "/"
          return (
            <a
              key={item.key}
              href={item.href}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {t(item.key)}
              {active && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </a>
          )
        })}
      </nav>
    </header>
  )
}
