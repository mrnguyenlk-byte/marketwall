"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY_BI = { en: "", vi: "" }

export default function AdminBrokerNewPage() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    slug: "",
    name: "",
    initials: "",
    category: "global",
    websiteUrl: "",
    affiliateUrl: "",
    description: "",
    rating: "4.5",
    minDeposit: "$100",
    minDepositValue: "100",
    trustScore: "85",
    spread: "0.5 pips",
    spreadValue: "0.5",
    leverage: "1:500",
    isActive: true,
    featured: false,
  })
  const [logo, setLogo] = useState<File | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.set(key, String(value)))
    if (logo) formData.set("logo", logo)

    const response = await fetch("/api/admin/brokers", { method: "POST", body: formData })
    const data = (await response.json()) as { error?: string; slug?: string }

    setPending(false)
    if (!response.ok) {
      setError(data.error ?? "Create failed")
      return
    }

    router.push(`/admin/brokers/${data.slug ?? form.slug}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add Broker" description="Create a new broker record." />

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border/80 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initials">Initials</Label>
            <Input
              id="initials"
              value={form.initials}
              onChange={(e) => setForm((f) => ({ ...f, initials: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="vn">vn</option>
              <option value="global">global</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="affiliateUrl">Affiliate URL</Label>
            <Input
              id="affiliateUrl"
              type="url"
              value={form.affiliateUrl}
              onChange={(e) => setForm((f) => ({ ...f, affiliateUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Rating</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minDeposit">Min deposit label</Label>
            <Input
              id="minDeposit"
              value={form.minDeposit}
              onChange={(e) => setForm((f) => ({ ...f, minDeposit: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo">Logo (PNG)</Label>
          <Input
            id="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
          />
        </div>
        <input type="hidden" name="license" value={JSON.stringify(EMPTY_BI)} />
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create broker"}
        </Button>
      </form>
    </div>
  )
}
