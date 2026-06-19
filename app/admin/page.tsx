import Link from "next/link"

import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAutomationEnvFlags } from "@/lib/admin/automation-env"
import { getLatestDailyAnalysis, getDailyAnalysisList } from "@/lib/daily-analysis/storage"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboardPage() {
  const [latest, posts, envFlags, unreadCount, brokerCount] = await Promise.all([
    getLatestDailyAnalysis(),
    getDailyAnalysisList(),
    Promise.resolve(getAutomationEnvFlags()),
    prisma.contactSubmission.count({ where: { read: false } }).catch(() => 0),
    prisma.broker.count({ where: { isActive: true } }).catch(() => 0),
  ])

  const quickLinks = [
    { href: "/admin/daily-analysis", label: "Daily Analysis", count: posts.length },
    { href: "/admin/brokers", label: "Brokers", count: brokerCount },
    { href: "/admin/contact", label: "Unread messages", count: unreadCount },
    { href: "/admin/site-settings", label: "Site Settings" },
    { href: "/admin/automation-logs", label: "Automation Logs" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of content, automation, and site configuration."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Daily Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {latest ? (
              <>
                <p className="font-medium">{latest.title}</p>
                <p className="line-clamp-2 text-muted-foreground">{latest.summary}</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={latest.publishStatus} />
                  <StatusBadge status={latest.telegramStatus} />
                  <StatusBadge status={latest.facebookStatus} detail={latest.facebookError} className="max-w-xs truncate" />
                </div>
                <Link
                  href={`/admin/daily-analysis/${latest.date}`}
                  className="text-xs text-primary hover:underline"
                >
                  Edit post →
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">No posts yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automation Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {Object.entries(envFlags).map(([key, configured]) => (
                <li key={key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{key}</span>
                  <StatusBadge status={configured ? "success" : "skipped"} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {posts.slice(0, 5).map((post) => (
                <li key={post.date} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/daily-analysis/${post.date}`}
                    className="truncate hover:text-primary"
                  >
                    {post.date} — {post.title}
                  </Link>
                  <StatusBadge status={post.publishStatus} />
                </li>
              ))}
              {posts.length === 0 ? (
                <li className="text-muted-foreground">No posts yet.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md border border-border/80 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
              >
                {link.label}
                {"count" in link && link.count !== undefined ? ` (${link.count})` : ""}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
