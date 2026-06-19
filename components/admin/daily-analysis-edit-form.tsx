"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DailyAnalysis, DailyAnalysisPublishStatus } from "@/lib/daily-analysis/types"

type Props = {
  article: DailyAnalysis
}

const PUBLISH_STATUSES: DailyAnalysisPublishStatus[] = ["draft", "pending", "published"]

export function DailyAnalysisEditForm({ article }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(article)
  const [pending, setPending] = useState(false)
  const [republishPending, setRepublishPending] = useState<"telegram" | "facebook" | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateField<K extends keyof DailyAnalysis>(key: K, value: DailyAnalysis[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setMessage(null)

    const response = await fetch(`/api/admin/daily-analysis/${form.date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = (await response.json()) as { error?: string; article?: DailyAnalysis }

    setPending(false)
    if (!response.ok) {
      setError(data.error ?? "Save failed")
      return
    }

    if (data.article) setForm(data.article)
    setMessage("Saved successfully.")
    router.refresh()
  }

  async function onDelete() {
    if (!confirm(`Delete daily analysis for ${form.date}?`)) return
    setPending(true)
    const response = await fetch(`/api/admin/daily-analysis/${form.date}`, { method: "DELETE" })
    setPending(false)
    if (!response.ok) {
      const data = (await response.json()) as { error?: string }
      setError(data.error ?? "Delete failed")
      return
    }
    router.push("/admin/daily-analysis")
    router.refresh()
  }

  async function onRepublish(channel: "telegram" | "facebook") {
    setRepublishPending(channel)
    setError(null)
    setMessage(null)

    const response = await fetch(
      `/api/admin/daily-analysis/${form.date}/republish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      },
    )
    const data = (await response.json()) as {
      error?: string
      article?: DailyAnalysis
      result?: { ok: boolean; error?: string }
    }

    setRepublishPending(null)
    if (!response.ok) {
      setError(data.error ?? "Republish failed")
      return
    }

    if (data.article) setForm(data.article)
    setMessage(
      data.result?.ok
        ? `${channel} republish succeeded.`
        : `${channel} republish: ${data.result?.error ?? "unknown"}`,
    )
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit — ${form.date}`}
        description={form.slug}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/daily-analysis/${form.slug}`}
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View public
            </Link>
            <Button
              variant="outline"
              size="sm"
              disabled={republishPending !== null}
              onClick={() => onRepublish("telegram")}
            >
              {republishPending === "telegram" ? "Publishing…" : "Republish Telegram"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={republishPending !== null}
              onClick={() => onRepublish("facebook")}
            >
              {republishPending === "facebook" ? "Publishing…" : "Republish Facebook"}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={form.publishStatus} />
        <StatusBadge status={form.telegramStatus} />
        <StatusBadge status={form.facebookStatus} detail={form.facebookError} className="max-w-md truncate" />
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <textarea
            id="summary"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.summary}
            onChange={(e) => updateField("summary", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vnindexAnalysis">VN-Index analysis</Label>
          <textarea
            id="vnindexAnalysis"
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.vnindexAnalysis}
            onChange={(e) => updateField("vnindexAnalysis", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goldAnalysis">Gold analysis</Label>
          <textarea
            id="goldAnalysis"
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.goldAnalysis}
            onChange={(e) => updateField("goldAnalysis", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="usMacroSummary">US macro summary</Label>
          <textarea
            id="usMacroSummary"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.usMacroSummary}
            onChange={(e) => updateField("usMacroSummary", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cta">CTA</Label>
          <Input
            id="cta"
            value={form.cta}
            onChange={(e) => updateField("cta", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="publishStatus">Publish status</Label>
          <select
            id="publishStatus"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={form.publishStatus}
            onChange={(e) =>
              updateField("publishStatus", e.target.value as DailyAnalysisPublishStatus)
            }
          >
            {PUBLISH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {message ? <p className="text-sm text-gain">{message}</p> : null}
        {error ? <p className="text-sm text-loss">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={onDelete}>
            Delete post
          </Button>
          <Link href="/admin/daily-analysis" className={buttonVariants({ variant: "outline" })}>
            Back to list
          </Link>
        </div>
      </form>
    </div>
  )
}
