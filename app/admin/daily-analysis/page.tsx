import Link from "next/link"

import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDailyAnalysisList } from "@/lib/daily-analysis/storage"

export default async function AdminDailyAnalysisListPage() {
  const posts = await getDailyAnalysisList()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Analysis"
        description="Manage automated market analysis posts."
        actions={
          <Link href="/admin/daily-analysis/new" className={buttonVariants()}>
            Create / Generate
          </Link>
        }
      />

      <div className="rounded-lg border border-border/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Facebook</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.date}>
                <TableCell className="font-mono text-xs">{post.date}</TableCell>
                <TableCell className="max-w-xs truncate">{post.title}</TableCell>
                <TableCell>
                  <StatusBadge status={post.publishStatus} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={post.telegramStatus} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={post.facebookStatus} detail={post.facebookError} className="max-w-[14rem] truncate" />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/daily-analysis/${post.date}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No daily analysis posts found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
