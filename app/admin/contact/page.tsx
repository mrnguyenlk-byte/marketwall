"use client"

import { useEffect, useState } from "react"

import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Submission = {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  read: boolean
  createdAt: string
}

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const response = await fetch("/api/admin/contact")
    const data = (await response.json()) as { submissions?: Submission[]; error?: string }
    setLoading(false)
    if (!response.ok) {
      setError(data.error ?? "Failed to load")
      return
    }
    setSubmissions(data.submissions ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggleRead(id: string, read: boolean) {
    await fetch("/api/admin/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    })
    await load()
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this submission?")) return
    await fetch(`/api/admin/contact?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Submissions"
        description="Messages from the public contact form."
        actions={
          <a href="/api/admin/contact/export" className={buttonVariants({ variant: "outline" })}>
            Export CSV
          </a>
        }
      />

      {error ? <p className="text-sm text-loss">{error}</p> : null}

      <div className="rounded-lg border border-border/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
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
              submissions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell className="max-w-[12rem] truncate">
                    {row.subject ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.read ? "published" : "pending"} />
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRead(row.id, !row.read)}
                    >
                      {row.read ? "Mark unread" : "Mark read"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No submissions yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
