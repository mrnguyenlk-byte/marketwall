import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { name?: string; email?: string; subject?: string; message?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const message = body.message?.trim()
  const subject = body.subject?.trim() || null

  if (!name || !email || !message) {
    return Response.json({ error: "name, email, and message are required" }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 })
  }

  if (message.length > 10_000) {
    return Response.json({ error: "Message too long" }, { status: 400 })
  }

  try {
    const submission = await prisma.contactSubmission.create({
      data: { name, email, message, subject },
    })
    return Response.json({ ok: true, id: submission.id }, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to save submission" }, { status: 500 })
  }
}
