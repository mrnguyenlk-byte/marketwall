"use client"

import { Mail, MapPin, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLang } from "@/lib/i18n"
import { SITE_EMAIL, TELEGRAM_LINK } from "@/lib/contact"
import { cn } from "@/lib/utils"

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

type ContactCard = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  displayText: string
  href?: string
  external?: boolean
  fullCardLink?: boolean
}

export function ContactPageContent() {
  const { t } = useLang()

  const contactCards: ContactCard[] = [
    {
      icon: Mail,
      label: t("contact.email"),
      displayText: t("contact.sendEmail"),
      href: `mailto:${SITE_EMAIL}`,
      fullCardLink: true,
    },
    {
      icon: TelegramIcon,
      label: t("contactFab.telegram"),
      displayText: t("contactFab.telegram"),
      href: TELEGRAM_LINK,
      external: true,
    },
    {
      icon: MapPin,
      label: t("contact.address"),
      displayText: t("contact.addressValue"),
    },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-bold text-foreground lg:text-2xl">
          {t("sec.contact")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("contact.tagline")}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {contactCards.map((item) => {
          const cardBody = (
            <CardContent className="flex items-start gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <item.icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                  {item.displayText}
                </p>
              </div>
            </CardContent>
          )

          if (item.fullCardLink && item.href) {
            return (
              <a
                key={item.label}
                href={item.href}
                {...(item.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                aria-label={item.displayText}
                className="block rounded-xl transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <Card className="gap-0 border-border/80 py-0 transition-colors hover:border-primary/40">
                  {cardBody}
                </Card>
              </a>
            )
          }

          return (
            <Card key={item.label} className="gap-0 border-border/80 py-0">
              {item.href ? (
                <a
                  href={item.href}
                  aria-label={item.displayText}
                  {...(item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="block rounded-xl transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {cardBody}
                </a>
              ) : (
                cardBody
              )}
            </Card>
          )
        })}
      </div>

      <Card className="gap-0 border-border/80 py-0">
        <CardContent className="space-y-4 p-5">
          <h2 className="text-base font-semibold text-foreground">{t("contact.formTitle")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("contact.name")}
              </span>
              <Input className="h-9 bg-secondary/50" placeholder={t("contact.name")} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("contact.email")}
              </span>
              <Input
                type="email"
                className="h-9 bg-secondary/50"
                placeholder="email@example.com"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("contact.subject")}
            </span>
            <Input className="h-9 bg-secondary/50" placeholder={t("contact.subject")} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("contact.message")}
            </span>
            <textarea
              rows={5}
              className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-1"
              placeholder={t("contact.message")}
            />
          </label>
          <Button className="gap-2">
            <Send className="size-4" aria-hidden />
            {t("contact.send")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
