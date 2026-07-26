"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  BrokerBackcomFields,
  EMPTY_BACKCOM_FORM,
  backcomFormToPolicy,
  type BrokerBackcomFormFields,
} from "@/components/admin/broker-backcom-fields"
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
    isActive: true,
  })
  const [backcom, setBackcom] = useState<BrokerBackcomFormFields>(EMPTY_BACKCOM_FORM)
  const [logo, setLogo] = useState<File | null>(null)
  const [autoFetchLogo, setAutoFetchLogo] = useState(true)

  const isGlobal = form.category === "global"

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.set(key, String(value)))

    if (isGlobal) {
      const policy = backcomFormToPolicy(backcom)
      formData.set("backcomType", policy.backcomType ?? "none")
      if (policy.backcomValue) formData.set("backcomValue", policy.backcomValue)
    } else {
      formData.set("backcomType", "none")
    }

    if (logo) formData.set("logo", logo)
    if (autoFetchLogo) formData.set("autoFetchLogo", "true")

    const response = await fetch("/api/admin/brokers", { method: "POST", body: formData })
    const data = (await response.json()) as {
      error?: string
      slug?: string
      broker?: { slug?: string }
    }

    setPending(false)
    if (!response.ok) {
      setError(data.error ?? "Create failed")
      return
    }

    router.push(`/admin/brokers/${data.broker?.slug ?? data.slug ?? form.slug}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add Broker" description="Thêm sàn — VN chỉ logo; Global thêm link ref và backcom." />

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
              placeholder="VD: SSI"
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
              <option value="vn">Trong nước (vn)</option>
              <option value="global">Quốc tế (global)</option>
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
              placeholder="https://..."
            />
          </div>
          {isGlobal ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="affiliateUrl">Link ref (Affiliate URL)</Label>
              <Input
                id="affiliateUrl"
                type="url"
                value={form.affiliateUrl}
                onChange={(e) => setForm((f) => ({ ...f, affiliateUrl: e.target.value }))}
                placeholder="https://...?ref=..."
              />
            </div>
          ) : null}
        </div>

        {isGlobal ? <BrokerBackcomFields value={backcom} onChange={setBackcom} /> : null}

        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/15 p-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Logo (tùy chọn)</Label>
            <Input
              id="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoFetchLogo}
              onChange={(e) => setAutoFetchLogo(e.target.checked)}
            />
            Tự lấy logo từ website nếu chưa upload
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          Hiển thị trên trang public
        </label>

        <input type="hidden" name="license" value={JSON.stringify(EMPTY_BI)} />
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create broker"}
        </Button>
      </form>
    </div>
  )
}
