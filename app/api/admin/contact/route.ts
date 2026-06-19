import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return Response.json({ submissions })
}

export async function PATCH(request: Request) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const body = (await request.json()) as { id?: string; read?: boolean }
  if (!body.id || typeof body.read !== "boolean") {
    return Response.json({ error: "id and read are required" }, { status: 400 })
  }

  const submission = await prisma.contactSubmission.update({
    where: { id: body.id },
    data: { read: body.read },
  })

  return Response.json({ submission })
}

export async function DELETE(request: Request) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return Response.json({ error: "id is required" }, { status: 400 })

  await prisma.contactSubmission.delete({ where: { id } })
  return Response.json({ ok: true })
}
