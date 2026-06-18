import fs from "fs/promises"
import path from "path"

import { generateDailyAnalysis } from "@/lib/daily-analysis/generate"
import { appendDailyAnalysisLog, saveDailyAnalysis } from "@/lib/daily-analysis/storage"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "daily-analysis")
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

type RunRequestBody = {
  date?: string
  vnindexImage?: string
  goldImage?: string
  usMacroData?: string
  secret?: string
}

function isValidDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false
  const parsed = new Date(`${date}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date)
}

function validateSecret(secret: string | undefined): boolean {
  const expected = process.env.DAILY_AUTOMATION_SECRET?.trim()
  if (!expected) return false
  return secret === expected
}

function unauthorizedResponse() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
}

function uploadPathsForDate(date: string) {
  return {
    vnindexImage: `/uploads/daily-analysis/${date}/vnindex.png`,
    goldImage: `/uploads/daily-analysis/${date}/gold.png`,
  }
}

async function saveUploadedImage(file: File, destPath: string): Promise<void> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(`Invalid image type: ${file.type || "unknown"}`)
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Invalid image size: ${file.size} bytes`)
  }

  await fs.mkdir(path.dirname(destPath), { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(destPath, buffer)
}

async function handleMultipartRequest(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ ok: false, error: "Invalid multipart form data" }, { status: 400 })
  }

  const secret = formData.get("secret")
  if (!validateSecret(typeof secret === "string" ? secret : undefined)) {
    return unauthorizedResponse()
  }

  const dateField = formData.get("date")
  const date = typeof dateField === "string" ? dateField.trim() : ""
  if (!date || !isValidDate(date)) {
    return Response.json(
      { ok: false, error: "Invalid date — expected YYYY-MM-DD" },
      { status: 400 },
    )
  }

  const vnindexFile = formData.get("vnindexImage")
  const goldFile = formData.get("goldImage")
  if (!(vnindexFile instanceof File) || !(goldFile instanceof File)) {
    return Response.json(
      { ok: false, error: "vnindexImage and goldImage files are required" },
      { status: 400 },
    )
  }

  const dateDir = path.join(UPLOADS_DIR, date)
  await fs.mkdir(UPLOADS_DIR, { recursive: true })

  try {
    await saveUploadedImage(vnindexFile, path.join(dateDir, "vnindex.png"))
    await saveUploadedImage(goldFile, path.join(dateDir, "gold.png"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save uploaded images"
    return Response.json({ ok: false, error: message }, { status: 400 })
  }

  const paths = uploadPathsForDate(date)

  const { article, source, fallbackUsed, model } = await generateDailyAnalysis(date, {
    vnindexImage: paths.vnindexImage,
    goldImage: paths.goldImage,
  })

  const saved = await saveDailyAnalysis(article)

  try {
    const modelNote = model ? ` model=${model}` : ""
    const fallbackNote = fallbackUsed ? " (fallback mock)" : ""
    await appendDailyAnalysisLog(
      date,
      `Generated daily analysis via ${source}${modelNote}${fallbackNote} (slug=${saved.slug})`,
    )
  } catch {
    // Logging is optional; do not fail the request.
  }

  return Response.json({
    success: true,
    date,
    vnindexImage: paths.vnindexImage,
    goldImage: paths.goldImage,
    article: saved,
  })
}

async function handleJsonRequest(request: Request) {
  let body: RunRequestBody
  try {
    body = (await request.json()) as RunRequestBody
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }

  if (!validateSecret(body.secret)) {
    return unauthorizedResponse()
  }

  const date = body.date?.trim()
  if (!date || !isValidDate(date)) {
    return Response.json(
      { ok: false, error: "Invalid date — expected YYYY-MM-DD" },
      { status: 400 },
    )
  }

  const { article, source, fallbackUsed, model } = await generateDailyAnalysis(date, {
    vnindexImage: body.vnindexImage,
    goldImage: body.goldImage,
    usMacroDataText: body.usMacroData,
  })

  const saved = await saveDailyAnalysis(article)

  try {
    const modelNote = model ? ` model=${model}` : ""
    const fallbackNote = fallbackUsed ? " (fallback mock)" : ""
    await appendDailyAnalysisLog(
      date,
      `Generated daily analysis via ${source}${modelNote}${fallbackNote} (slug=${saved.slug})`,
    )
  } catch {
    // Logging is optional; do not fail the request.
  }

  return Response.json(saved, { status: 200 })
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("multipart/form-data")) {
    return handleMultipartRequest(request)
  }
  return handleJsonRequest(request)
}
