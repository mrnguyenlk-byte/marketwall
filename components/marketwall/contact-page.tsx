"use client"

import { Mail, MapPin, Phone, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLang } from "@/lib/i18n"
import { SITE_EMAIL } from "@/lib/brand"

export function ContactPageContent() {
  const { t } = useLang()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-bold text-foreground lg:text-2xl">
          {t("sec.contact")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("contact.tagline")}</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Mail, label: t("contact.email"), value: SITE_EMAIL },
          { icon: Phone, label: t("contact.phone"), value: "+84 28 1234 5678" },
          { icon: MapPin, label: t("contact.address"), value: t("contact.addressValue") },
        ].map((item) => (
          <Card key={item.label} className="gap-0 border-border/80 py-0">
            <CardContent className="flex items-start gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <item.icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
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
