"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type AdminBroker = {
  slug: string
  name: string
  category: string
  rating: number
  minDeposit: string
  isActive: boolean
  featured: boolean
  logoUrl: string | null
}

export default function AdminBrokersPage() {
  const router = useRouter()
  const [brokers, setBrokers] = useState<AdminBroker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadBrokers() {
    setLoading(true)
    const response = await fetch("/api/admin/brokers")
    const data = (await response.json()) as { brokers?: AdminBroker[]; error?: string }
    setLoading(false)
    if (!response.ok) {
      setError(data.error ?? "Failed to load brokers")
      return
    }
    setBrokers(data.brokers ?? [])
  }

  useEffect(() => {
    void loadBrokers()
  }, [])

  async function toggleActive(slug: string, isActive: boolean) {
    const response = await fetch(`/api/admin/brokers/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    })
    if (!response.ok) return
    await loadBrokers()
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brokers"
        description="Manage broker catalog in the database."
        actions={
          <Button onClick={() => router.push("/admin/brokers/new")}>Add broker</Button>
        }
      />

      {error ? <p className="text-sm text-loss">{error}</p> : null}

      <div className="rounded-lg border border-border/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Min deposit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : (
              brokers.map((broker) => (
                <TableRow key={broker.slug}>
                  <TableCell className="font-medium">{broker.name}</TableCell>
                  <TableCell>{broker.category}</TableCell>
                  <TableCell>{broker.rating}</TableCell>
                  <TableCell>{broker.minDeposit}</TableCell>
                  <TableCell>
                    <StatusBadge status={broker.isActive ? "published" : "draft"} />
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/brokers/${broker.slug}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(broker.slug, !broker.isActive)}
                    >
                      {broker.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && brokers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No brokers in database. Public page uses static catalog.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
