import fs from "fs/promises"
import path from "path"
import { head, list, put } from "@vercel/blob"
import type { DailyAnalysis, DailyAnalysisOpenAiErrorLog } from "./types"

const CONTENT_DIR = path.join(process.cwd(), "content", "daily-analysis")
const LOGS_DIR = path.join(CONTENT_DIR, "logs")
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "daily-analysis")

const DATE_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}\.json$/
const BLOB_ARTICLES_PREFIX = "daily-analysis/articles/"
const BLOB_LOGS_PREFIX = "daily-analysis/logs/"
const BLOB_OPENAI_ERRORS_SUFFIX = "-openai-errors.json"

export type StorageBackend = "local" | "blob"
export type DailyAnalysisImageName = "vnindex.png" | "gold.png"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

function isServerlessRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_VERSION)
}

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined
}

/** Selects filesystem (dev) or Vercel Blob (when token is set). */
export function getStorageBackend(): StorageBackend {
  if (blobToken()) return "blob"
  return "local"
}

function assertWritableStorage(): void {
  if (isServerlessRuntime() && !blobToken()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is required for daily analysis storage on Vercel/serverless",
    )
  }
}

function articlePath(date: string): string {
  return path.join(CONTENT_DIR, `${date}.json`)
}

function blobArticlePathname(date: string): string {
  return `${BLOB_ARTICLES_PREFIX}${date}.json`
}

function blobImagePathname(date: string, filename: DailyAnalysisImageName): string {
  return `daily-analysis/${date}/${filename}`
}

function blobLogPathname(date: string): string {
  return `${BLOB_LOGS_PREFIX}${date}.log`
}

function blobOpenAiErrorLogPathname(date: string): string {
  return `${BLOB_LOGS_PREFIX}${date}${BLOB_OPENAI_ERRORS_SUFFIX}`
}

function localImageUrl(date: string, filename: DailyAnalysisImageName): string {
  return `/uploads/daily-analysis/${date}/${filename}`
}

async function readLocalArticles(): Promise<DailyAnalysis[]> {
  try {
    const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true })
    const articles: DailyAnalysis[] = []

    for (const entry of entries) {
      if (!entry.isFile() || !DATE_FILE_PATTERN.test(entry.name)) continue
      try {
        const raw = await fs.readFile(path.join(CONTENT_DIR, entry.name), "utf-8")
        articles.push(JSON.parse(raw) as DailyAnalysis)
      } catch {
        // Skip unreadable or invalid JSON files.
      }
    }

    return articles
  } catch {
    return []
  }
}

async function readBlobArticles(): Promise<DailyAnalysis[]> {
  const token = blobToken()
  if (!token) return []

  const { blobs } = await list({ prefix: BLOB_ARTICLES_PREFIX, token })
  const articles: DailyAnalysis[] = []

  for (const blob of blobs) {
    if (!blob.pathname.endsWith(".json")) continue
    try {
      const response = await fetch(blob.url, { cache: "no-store" })
      if (!response.ok) continue
      articles.push((await response.json()) as DailyAnalysis)
    } catch {
      // Skip unreadable blobs.
    }
  }

  return articles
}

function mergeArticlesByDate(...groups: DailyAnalysis[][]): DailyAnalysis[] {
  const byDate = new Map<string, DailyAnalysis>()
  for (const group of groups) {
    for (const article of group) {
      byDate.set(article.date, article)
    }
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date))
}

export async function saveDailyAnalysisImage(
  date: string,
  filename: DailyAnalysisImageName,
  file: File,
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(`Invalid image type: ${file.type || "unknown"}`)
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Invalid image size: ${file.size} bytes`)
  }

  assertWritableStorage()
  const buffer = Buffer.from(await file.arrayBuffer())
  const backend = getStorageBackend()

  if (backend === "blob") {
    const token = blobToken()
    const blob = await put(blobImagePathname(date, filename), buffer, {
      access: "public",
      contentType: file.type,
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    return blob.url
  }

  const destPath = path.join(UPLOADS_DIR, date, filename)
  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await fs.writeFile(destPath, buffer)
  return localImageUrl(date, filename)
}

export async function saveDailyAnalysis(article: DailyAnalysis): Promise<DailyAnalysis> {
  assertWritableStorage()
  const backend = getStorageBackend()

  if (backend === "blob") {
    const token = blobToken()
    await put(blobArticlePathname(article.date), JSON.stringify(article, null, 2), {
      access: "public",
      contentType: "application/json",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    return article
  }

  await fs.mkdir(CONTENT_DIR, { recursive: true })
  await fs.writeFile(articlePath(article.date), JSON.stringify(article, null, 2), "utf-8")
  return article
}

export async function getDailyAnalysisList(): Promise<DailyAnalysis[]> {
  const [localArticles, blobArticles] = await Promise.all([
    readLocalArticles(),
    blobToken() ? readBlobArticles() : Promise.resolve([]),
  ])
  return mergeArticlesByDate(localArticles, blobArticles)
}

export async function getLatestDailyAnalysis(): Promise<DailyAnalysis | null> {
  const list = await getDailyAnalysisList()
  return list[0] ?? null
}

export async function getDailyAnalysisBySlug(slug: string): Promise<DailyAnalysis | null> {
  const list = await getDailyAnalysisList()
  return list.find((article) => article.slug === slug) ?? null
}

async function appendBlobText(pathname: string, line: string): Promise<void> {
  const token = blobToken()
  let existing = ""

  try {
    const meta = await head(pathname, { token })
    const response = await fetch(meta.url, { cache: "no-store" })
    if (response.ok) {
      existing = await response.text()
    }
  } catch {
    // New log file for this pathname.
  }

  await put(pathname, existing + line, {
    access: "public",
    contentType: "text/plain",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

export async function appendDailyAnalysisLog(date: string, message: string): Promise<void> {
  assertWritableStorage()
  const line = `[${new Date().toISOString()}] ${message}\n`
  const backend = getStorageBackend()

  if (backend === "blob") {
    await appendBlobText(blobLogPathname(date), line)
    return
  }

  await fs.mkdir(LOGS_DIR, { recursive: true })
  await fs.appendFile(path.join(LOGS_DIR, `${date}.log`), line, "utf-8")
}

function openAiErrorLogPath(date: string): string {
  return path.join(LOGS_DIR, `${date}${BLOB_OPENAI_ERRORS_SUFFIX}`)
}

async function readBlobOpenAiErrors(date: string): Promise<DailyAnalysisOpenAiErrorLog[]> {
  const token = blobToken()
  const pathname = blobOpenAiErrorLogPathname(date)

  try {
    const meta = await head(pathname, { token })
    const response = await fetch(meta.url, { cache: "no-store" })
    if (!response.ok) return []

    const parsed = (await response.json()) as unknown
    if (Array.isArray(parsed)) return parsed as DailyAnalysisOpenAiErrorLog[]
    if (parsed && typeof parsed === "object") return [parsed as DailyAnalysisOpenAiErrorLog]
  } catch {
    // New log file for this date.
  }

  return []
}

/** Append OpenAI failure entries to daily-analysis/logs/YYYY-MM-DD-openai-errors.json (or local equivalent). */
export async function logDailyAnalysisOpenAiError(
  date: string,
  entry: DailyAnalysisOpenAiErrorLog,
): Promise<void> {
  assertWritableStorage()
  const backend = getStorageBackend()

  if (backend === "blob") {
    const token = blobToken()
    const pathname = blobOpenAiErrorLogPathname(date)
    const existing = await readBlobOpenAiErrors(date)
    existing.push(entry)
    await put(pathname, JSON.stringify(existing, null, 2), {
      access: "public",
      contentType: "application/json",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    return
  }

  await fs.mkdir(LOGS_DIR, { recursive: true })
  const filePath = openAiErrorLogPath(date)

  let existing: DailyAnalysisOpenAiErrorLog[] = []
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      existing = parsed as DailyAnalysisOpenAiErrorLog[]
    } else if (parsed && typeof parsed === "object") {
      existing = [parsed as DailyAnalysisOpenAiErrorLog]
    }
  } catch {
    // New log file for this date.
  }

  existing.push(entry)
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8")
}
