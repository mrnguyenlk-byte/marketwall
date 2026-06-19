import "server-only"

import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { UserRole } from "@/lib/generated/prisma/enums"

export type AdminSession = {
  user: {
    id: string
    email?: string | null
    name?: string | null
    role: typeof UserRole.admin
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  if (session.user.role !== UserRole.admin) return null
  return session as AdminSession
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) {
    redirect("/login?callbackUrl=/admin")
  }
  return session
}

export async function requireAdminApi(): Promise<AdminSession | Response> {
  const session = await getAdminSession()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  return session
}

export function isAdminApiError(
  result: AdminSession | Response,
): result is Response {
  return result instanceof Response
}
