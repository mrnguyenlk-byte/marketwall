import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET() {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  })

  const header = ["id", "createdAt", "name", "email", "subject", "message", "read"].join(",")
  const rows = submissions.map((row) =>
    [
      row.id,
      row.createdAt.toISOString(),
      row.name,
      row.email,
      row.subject ?? "",
      row.message,
      String(row.read),
    ]
      .map(csvEscape)
      .join(","),
  )

  const csv = [header, ...rows].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contact-submissions.csv"',
    },
  })
}
