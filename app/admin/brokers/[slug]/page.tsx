"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  BrokerBackcomFields,
  EMPTY_BACKCOM_FORM,
  backcomFormToPolicy,
  policyToBackcomForm,
  type BrokerBackcomFormFields,
} from "@/components/admin/broker-backcom-fields"
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
  isActive: boolean
  backcomType: string | null
  backcomValue: string | null
}

export default function AdminBrokerEditPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [form, setForm] = useState<BrokerDetail | null>(null)
  const [backcom, setBackcom] = useState<BrokerBackcomFormFields>(EMPTY_BACKCOM_FORM)
  const [pending, setPending] = useState(false)
  const [fetchingLogo, setFetchingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [autoFetchLogo, setAutoFetchLogo] = useState(false)

  const isGlobal = form?.category === "global"

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/admin/brokers/${params.slug}`)
      const data = (await response.json()) as { broker?: BrokerDetail; error?: string }
      if (!response.ok) {
        setError(data.error ?? "Not found")
        return
      }
      if (data.broker) {
        setForm(data.broker)
        setBackcom(policyToBackcomForm(data.broker.backcomType, data.broker.backcomValue))
      }
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
    formData.set("isActive", String(form.isActive))

    if (isGlobal) {
      const policy = backcomFormToPolicy(backcom)
      formData.set("backcomType", policy.backcomType ?? "none")
      if (policy.backcomValue) formData.set("backcomValue", policy.backcomValue)
    } else {
      formData.set("backcomType", "none")
    }

    if (logo) formData.set("logo", logo)
    if (autoFetchLogo) formData.set("autoFetchLogo", "true")

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
    if (data.broker) {
      setForm(data.broker)
      setBackcom(policyToBackcomForm(data.broker.backcomType, data.broker.backcomValue))
      setAutoFetchLogo(false)
      setLogo(null)
    }
    router.refresh()
  }

  async function onFetchLogo() {
    if (!form) return
    setFetchingLogo(true)
    setError(null)

    const formData = new FormData()
    formData.set("autoFetchLogo", "true")

    const response = await fetch(`/api/admin/brokers/${form.slug}`, {
      method: "PUT",
      body: formData,
    })
    const data = (await response.json()) as { error?: string; broker?: BrokerDetail }

    setFetchingLogo(false)
    if (!response.ok) {
      setError(data.error ?? "Could not fetch logo")
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
      <PageHeader
        title={`Edit — ${form.name}`}
        description={`${form.slug} · ${form.category === "vn" ? "Trong nước" : "Quốc tế"}`}
      />

      <form onSubmit={onSave} className="space-y-4 rounded-lg border border-border/80 p-5">
        <div className="flex flex-wrap items-center gap-4">
          {form.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.logoUrl}
              alt=""
              className="h-20 w-20 rounded-2xl border border-border bg-card object-contain p-2"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
              No logo
            </div>
          )}
          <Button type="button" variant="outline" size="sm" disabled={fetchingLogo} onClick={onFetchLogo}>
            {fetchingLogo ? "Fetching…" : "Fetch logo from website"}
          </Button>
        </div>

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
            <Label htmlFor="initials">Initials</Label>
            <Input
              id="initials"
              value={form.initials}
              onChange={(e) => setForm({ ...form, initials: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="vn">Trong nước (vn)</option>
              <option value="global">Quốc tế (global)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
            />
          </div>
          {isGlobal ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="affiliateUrl">Link ref (Affiliate URL)</Label>
              <Input
                id="affiliateUrl"
                type="url"
                value={form.affiliateUrl ?? ""}
                onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
              />
            </div>
          ) : null}
        </div>

        {isGlobal ? <BrokerBackcomFields value={backcom} onChange={setBackcom} /> : null}

        <div className="space-y-2">
          <Label htmlFor="logo">Replace logo</Label>
          <Input
            id="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoFetchLogo}
              onChange={(e) => setAutoFetchLogo(e.target.checked)}
            />
            Tự lấy logo khi lưu (nếu chưa chọn file)
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Hiển thị trên trang public
        </label>

        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
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
