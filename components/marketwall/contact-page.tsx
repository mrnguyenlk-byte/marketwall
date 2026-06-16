"use client"

import { Mail, MapPin, Phone, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLang } from "@/lib/i18n"
import {
  SITE_EMAIL,
  SITE_PHONE,
  SITE_PHONE_TEL,
  TELEGRAM_LINK,
  ZALO_LINK,
} from "@/lib/contact"
import { cn } from "@/lib/utils"

function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden>
      <path d="M17.871 3.385a15.908 15.908 0 0 0-5.812-1.385c-5.578 0-10.059 3.896-10.059 8.694 0 2.566 1.382 4.885 3.531 6.451L3.634 22l4.647-1.93c1.176.362 2.426.56 3.773.56 5.578 0 10.059-3.896 10.059-8.694 0-.485-.038-.962-.115-1.426.888-.675 1.721-1.454 2.436-2.348-.337.028-.68.042-1.025.042-5.578 0-10.1 3.842-10.1 8.506 0 1.496.472 2.886 1.263 4.042.273-.196.552-.381.838-.552-.068-.514-.105-1.038-.105-1.574 0-4.08 3.544-7.392 7.915-7.392.309 0 .613.017.914.05z" />
    </svg>
  )
}

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
  value: string
  href?: string
  external?: boolean
}

export function ContactPageContent() {
  const { t } = useLang()

  const contactCards: ContactCard[] = [
    {
      icon: Mail,
      label: t("contact.email"),
      value: SITE_EMAIL,
      href: `mailto:${SITE_EMAIL}`,
    },
    {
      icon: Phone,
      label: t("contact.phone"),
      value: SITE_PHONE,
      href: `tel:${SITE_PHONE_TEL}`,
    },
    {
      icon: TelegramIcon,
      label: t("contactFab.telegram"),
      value: TELEGRAM_LINK.replace(/^https?:\/\//, ""),
      href: TELEGRAM_LINK,
      external: true,
    },
    {
      icon: ZaloIcon,
      label: t("contactFab.zalo"),
      value: ZALO_LINK.replace(/^https?:\/\//, ""),
      href: ZALO_LINK,
      external: true,
    },
    {
      icon: MapPin,
      label: t("contact.address"),
      value: t("contact.addressValue"),
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
        {contactCards.map((item) => (
          <Card key={item.label} className="gap-0 border-border/80 py-0">
            <CardContent className="flex items-start gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <item.icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    {...(item.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="mt-0.5 block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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
