"use client"

import { useEffect, useState } from "react"

import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type SettingsForm = {
  email: string
  phone: string
  telegramLink: string
  facebookLink: string
  zaloLink: string
  liveUrl: string
  liveStreamUrl: string
  communityCtaUrl: string
  communityCta: string
  footerContent: string
}

export default function AdminSiteSettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    email: "",
    phone: "",
    telegramLink: "",
    facebookLink: "",
    zaloLink: "",
    liveUrl: "",
    liveStreamUrl: "",
    communityCtaUrl: "",
    communityCta: "",
    footerContent: "",
  })
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/site-settings")
      const data = (await response.json()) as { settings?: SettingsForm }
      if (data.settings) {
        setForm({
          email: data.settings.email ?? "",
          phone: data.settings.phone ?? "",
          telegramLink: data.settings.telegramLink ?? "",
          facebookLink: data.settings.facebookLink ?? "",
          zaloLink: data.settings.zaloLink ?? "",
          liveUrl: data.settings.liveUrl ?? "",
          liveStreamUrl: data.settings.liveStreamUrl ?? "",
          communityCtaUrl: data.settings.communityCtaUrl ?? "",
          communityCta: data.settings.communityCta ?? "",
          footerContent: data.settings.footerContent ?? "",
        })
      }
    }
    void load()
  }, [])

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = (await response.json()) as { error?: string }

    setPending(false)
    if (!response.ok) {
      setError(data.error ?? "Save failed")
      return
    }
    setMessage("Settings saved.")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Site Settings"
        description="Each public button has its own link. Changing one does not update the others."
      />

      <form onSubmit={onSave} className="space-y-4 rounded-lg border border-border/80 p-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>

        <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
          <p className="text-sm font-medium text-foreground">Contact buttons</p>
          <div className="space-y-2">
            <Label htmlFor="telegramLink">Telegram link</Label>
            <Input
              id="telegramLink"
              type="url"
              placeholder="https://t.me/…"
              value={form.telegramLink}
              onChange={(e) => setForm((f) => ({ ...f, telegramLink: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Contact FAB / Contact page only.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookLink">Facebook link</Label>
            <Input
              id="facebookLink"
              type="url"
              value={form.facebookLink}
              onChange={(e) => setForm((f) => ({ ...f, facebookLink: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zaloLink">Zalo link</Label>
            <Input
              id="zaloLink"
              type="url"
              value={form.zaloLink}
              onChange={(e) => setForm((f) => ({ ...f, zaloLink: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Contact FAB / Contact page only.</p>
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
          <p className="text-sm font-medium text-foreground">LIVE button</p>
          <div className="space-y-2">
            <Label htmlFor="liveUrl">Live Link</Label>
            <Input
              id="liveUrl"
              type="url"
              placeholder="https://…"
              value={form.liveUrl}
              onChange={(e) => setForm((f) => ({ ...f, liveUrl: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Generic destination for the LIVE nav button.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="liveStreamUrl">Live stream (TikTok / YouTube / Facebook)</Label>
            <Input
              id="liveStreamUrl"
              type="url"
              placeholder="https://www.tiktok.com/@…/live or YouTube / Facebook live URL"
              value={form.liveStreamUrl}
              onChange={(e) => setForm((f) => ({ ...f, liveStreamUrl: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Optional. If set, used for the LIVE button instead of Live Link above.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
          <p className="text-sm font-medium text-foreground">
            Daily Analysis — Tham gia cộng đồng
          </p>
          <div className="space-y-2">
            <Label htmlFor="communityCtaUrl">Community CTA link</Label>
            <Input
              id="communityCtaUrl"
              type="url"
              placeholder="https://t.me/… or any community URL"
              value={form.communityCtaUrl}
              onChange={(e) => setForm((f) => ({ ...f, communityCtaUrl: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Independent from Telegram link above. Only controls the Daily Analysis community
              button.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="communityCta">Community CTA text</Label>
            <textarea
              id="communityCta"
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Leave empty to use the default button label"
              value={form.communityCta}
              onChange={(e) => setForm((f) => ({ ...f, communityCta: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="footerContent">Footer content</Label>
          <textarea
            id="footerContent"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.footerContent}
            onChange={(e) => setForm((f) => ({ ...f, footerContent: e.target.value }))}
          />
        </div>
        {message ? <p className="text-sm text-gain">{message}</p> : null}
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  )
}
