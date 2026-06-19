"use client"

import { useState } from "react"
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

export function ContactPageContent({
  email = SITE_EMAIL,
  telegramLink = TELEGRAM_LINK,
}: {
  email?: string
  telegramLink?: string
} = {}) {
  const { t } = useLang()
  const [name, setName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setFeedback(null)
    setError(null)

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: formEmail, subject, message }),
    })
    const data = (await response.json()) as { error?: string }

    setPending(false)
    if (!response.ok) {
      setError(data.error ?? "Failed to send")
      return
    }

    setFeedback(t("contact.send"))
    setName("")
    setFormEmail("")
    setSubject("")
    setMessage("")
  }

  const contactCards: ContactCard[] = [
    {
      icon: Mail,
      label: t("contact.email"),
      displayText: t("contact.sendEmail"),
      href: `mailto:${email}`,
      fullCardLink: true,
    },
    {
      icon: TelegramIcon,
      label: t("contactFab.telegram"),
      displayText: t("contactFab.telegram"),
      href: telegramLink,
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
          <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("contact.name")}
              </span>
              <Input
                className="h-9 bg-secondary/50"
                placeholder={t("contact.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("contact.email")}
              </span>
              <Input
                type="email"
                className="h-9 bg-secondary/50"
                placeholder="email@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("contact.subject")}
            </span>
            <Input
              className="h-9 bg-secondary/50"
              placeholder={t("contact.subject")}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("contact.message")}
            </span>
            <textarea
              rows={5}
              className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-1"
              placeholder={t("contact.message")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </label>
          {feedback ? <p className="text-sm text-gain">{feedback}</p> : null}
          {error ? <p className="text-sm text-loss">{error}</p> : null}
          <Button type="submit" className="gap-2" disabled={pending}>
            <Send className="size-4" aria-hidden />
            {pending ? "…" : t("contact.send")}
          </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
