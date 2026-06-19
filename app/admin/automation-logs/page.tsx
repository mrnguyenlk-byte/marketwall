import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listBlobAutomationLogs } from "@/lib/daily-analysis/storage"
import { prisma } from "@/lib/prisma"

export default async function AdminAutomationLogsPage() {
  const [dbLogs, blobLogs] = await Promise.all([
    prisma.automationLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }).catch(() => []),
    listBlobAutomationLogs(),
  ])

  const merged = [
    ...dbLogs.map((log) => ({
      id: log.id,
      date: log.date,
      source: "db" as const,
      status: log.status,
      telegramStatus: log.telegramStatus,
      facebookStatus: log.facebookStatus,
      facebookError: log.facebookError,
      createdAt: log.createdAt.toISOString(),
      raw: null as string | null,
    })),
    ...blobLogs.map((log, index) => ({
      id: `blob-${log.date}-${index}`,
      date: log.date,
      source: log.source,
      status: log.status,
      telegramStatus: log.telegramStatus ?? null,
      facebookStatus: log.facebookStatus ?? null,
      facebookError: null as string | null,
      createdAt: log.createdAt,
      raw: log.raw ?? null,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation Logs"
        description="Run history from database and Vercel Blob / local log files."
      />

      <div className="rounded-lg border border-border/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Facebook</TableHead>
              <TableHead>Logged at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merged.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">{log.date}</TableCell>
                <TableCell>{log.source}</TableCell>
                <TableCell className="max-w-md truncate text-xs" title={log.raw ?? log.status}>
                  {log.status}
                </TableCell>
                <TableCell>
                  <StatusBadge status={log.telegramStatus} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={log.facebookStatus} detail={log.facebookError} className="max-w-[14rem] truncate" />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {merged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No automation logs found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
