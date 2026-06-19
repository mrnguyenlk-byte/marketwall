"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminDailyAnalysisNewPage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [vnindexImage, setVnindexImage] = useState<File | null>(null)
  const [goldImage, setGoldImage] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onGenerate(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set("date", date)
    if (vnindexImage) formData.set("vnindexImage", vnindexImage)
    if (goldImage) formData.set("goldImage", goldImage)

    const response = await fetch("/api/admin/daily-analysis/generate", {
      method: "POST",
      body: formData,
    })
    const data = (await response.json()) as { error?: string; date?: string }

    setPending(false)
    if (!response.ok) {
      setError(data.error ?? "Generation failed")
      return
    }

    router.push(`/admin/daily-analysis/${data.date ?? date}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Create Daily Analysis"
        description="Generate a new post with optional chart images."
      />

      <form onSubmit={onGenerate} className="space-y-4 rounded-lg border border-border/80 p-5">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vnindex">VN-Index chart (optional)</Label>
          <Input
            id="vnindex"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setVnindexImage(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gold">Gold chart (optional)</Label>
          <Input
            id="gold"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setGoldImage(e.target.files?.[0] ?? null)}
          />
        </div>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate post"}
        </Button>
      </form>
    </div>
  )
}
