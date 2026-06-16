import { hashPassword } from "@/lib/auth/password"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type RegisterBody = {
  email?: string
  password?: string
  name?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const name = body.name?.trim() || undefined

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    })

    return Response.json({ ok: true, user }, { status: 201 })
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }
}
