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
        description="Contact, social links, and footer content. Public site falls back to defaults when empty."
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
        <div className="space-y-2">
          <Label htmlFor="telegramLink">Telegram link</Label>
          <Input
            id="telegramLink"
            value={form.telegramLink}
            onChange={(e) => setForm((f) => ({ ...f, telegramLink: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facebookLink">Facebook link</Label>
          <Input
            id="facebookLink"
            value={form.facebookLink}
            onChange={(e) => setForm((f) => ({ ...f, facebookLink: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zaloLink">Zalo link</Label>
          <Input
            id="zaloLink"
            value={form.zaloLink}
            onChange={(e) => setForm((f) => ({ ...f, zaloLink: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="communityCta">Community CTA</Label>
          <textarea
            id="communityCta"
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.communityCta}
            onChange={(e) => setForm((f) => ({ ...f, communityCta: e.target.value }))}
          />
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
