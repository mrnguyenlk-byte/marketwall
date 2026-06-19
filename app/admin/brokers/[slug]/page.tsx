"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { PageHeader } from "@/components/admin/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type BrokerDetail = {
  slug: string
  name: string
  initials: string
  category: string
  websiteUrl: string
  affiliateUrl: string | null
  logoUrl: string | null
  description: string | null
  rating: number
  minDeposit: string
  minDepositValue: number
  trustScore: number
  spread: string
  spreadValue: number
  leverage: string
  isActive: boolean
  featured: boolean
}

export default function AdminBrokerEditPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [form, setForm] = useState<BrokerDetail | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logo, setLogo] = useState<File | null>(null)

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/admin/brokers/${params.slug}`)
      const data = (await response.json()) as { broker?: BrokerDetail; error?: string }
      if (!response.ok) {
        setError(data.error ?? "Not found")
        return
      }
      if (data.broker) setForm(data.broker)
    }
    void load()
  }, [params.slug])

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    if (!form) return
    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set("name", form.name)
    formData.set("initials", form.initials)
    formData.set("category", form.category)
    formData.set("websiteUrl", form.websiteUrl)
    formData.set("affiliateUrl", form.affiliateUrl ?? "")
    formData.set("description", form.description ?? "")
    formData.set("rating", String(form.rating))
    formData.set("minDeposit", form.minDeposit)
    formData.set("minDepositValue", String(form.minDepositValue))
    formData.set("trustScore", String(form.trustScore))
    formData.set("spread", form.spread)
    formData.set("spreadValue", String(form.spreadValue))
    formData.set("leverage", form.leverage)
    formData.set("isActive", String(form.isActive))
    formData.set("featured", String(form.featured))
    if (logo) formData.set("logo", logo)

    const response = await fetch(`/api/admin/brokers/${form.slug}`, {
      method: "PUT",
      body: formData,
    })
    const data = (await response.json()) as { error?: string; broker?: BrokerDetail }

    setPending(false)
    if (!response.ok) {
      setError(data.error ?? "Save failed")
      return
    }
    if (data.broker) setForm(data.broker)
    router.refresh()
  }

  async function onDelete() {
    if (!form || !confirm(`Delete broker ${form.name}?`)) return
    const response = await fetch(`/api/admin/brokers/${form.slug}`, { method: "DELETE" })
    if (!response.ok) {
      const data = (await response.json()) as { error?: string }
      setError(data.error ?? "Delete failed")
      return
    }
    router.push("/admin/brokers")
    router.refresh()
  }

  if (!form && !error) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  if (!form) {
    return <p className="text-loss">{error}</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={`Edit — ${form.name}`} description={form.slug} />

      <form onSubmit={onSave} className="space-y-4 rounded-lg border border-border/80 p-5">
        {form.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.logoUrl} alt="" className="h-12 w-auto rounded" />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Rating</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Replace logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active on public site
        </label>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
          <Link href="/admin/brokers" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
        </div>
      </form>
    </div>
  )
}
