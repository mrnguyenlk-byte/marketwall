import fs from "fs/promises"
import path from "path"
import {
  deleteR2Object,
  getR2ObjectJson,
  getR2ObjectText,
  isR2Configured,
  listR2ObjectKeys,
  putR2Object,
} from "@/lib/r2"
import type { DailyAnalysis, DailyAnalysisOpenAiErrorLog } from "./types"

const CONTENT_DIR = path.join(process.cwd(), "content", "daily-analysis")
const LOGS_DIR = path.join(CONTENT_DIR, "logs")
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "daily-analysis")

const DATE_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}\.json$/
const R2_ARTICLES_PREFIX = "daily-analysis/articles/"
const R2_LOGS_PREFIX = "daily-analysis/logs/"
const OPENAI_ERRORS_SUFFIX = "-openai-errors.json"
const VN_TIMEZONE = "Asia/Ho_Chi_Minh"

export type StorageBackend = "local" | "r2"
export type DailyAnalysisImageName = "vnindex.png" | "gold.png"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

function isServerlessRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_VERSION)
}

/** Selects filesystem (dev) or Cloudflare R2 (when credentials are set). */
export function getStorageBackend(): StorageBackend {
  if (isR2Configured()) return "r2"
  return "local"
}

function assertWritableStorage(): void {
  if (isServerlessRuntime() && !isR2Configured()) {
    throw new Error(
      "Cloudflare R2 is required for daily analysis storage on Vercel/serverless (set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)",
    )
  }
}

function articlePath(date: string): string {
  return path.join(CONTENT_DIR, `${date}.json`)
}

function r2ArticleKey(date: string): string {
  return `${R2_ARTICLES_PREFIX}${date}.json`
}

/** YYYYMMDD-HHmmss in Asia/Ho_Chi_Minh — unique per upload to bust CDN cache. */
function timestampImagePrefix(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: VN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date())

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00"

  return `${pick("year")}${pick("month")}${pick("day")}-${pick("hour")}${pick("minute")}${pick("second")}`
}

function timestampedImageFilename(baseName: DailyAnalysisImageName): string {
  return `${timestampImagePrefix()}-${baseName}`
}

function r2LogKey(date: string): string {
  return `${R2_LOGS_PREFIX}${date}.log`
}

function r2OpenAiErrorLogKey(date: string): string {
  return `${R2_LOGS_PREFIX}${date}${OPENAI_ERRORS_SUFFIX}`
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

async function readR2Articles(): Promise<DailyAnalysis[]> {
  if (!isR2Configured()) return []

  const objects = await listR2ObjectKeys(R2_ARTICLES_PREFIX)
  const articles: DailyAnalysis[] = []

  for (const object of objects) {
    if (!object.key.endsWith(".json")) continue
    try {
      const article = await getR2ObjectJson<DailyAnalysis>(object.key)
      if (article) articles.push(article)
    } catch {
      // Skip unreadable objects.
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
  const stampedFilename = timestampedImageFilename(filename)
  const backend = getStorageBackend()

  if (backend === "r2") {
    // Path: daily-analysis/YYYY-MM-DD/{timestamp}-{vnindex|gold}.png
    return putR2Object({
      key: `daily-analysis/${date}/${stampedFilename}`,
      body: buffer,
      contentType: file.type,
    })
  }

  const destPath = path.join(UPLOADS_DIR, date, stampedFilename)
  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await fs.writeFile(destPath, buffer)
  return `/uploads/daily-analysis/${date}/${stampedFilename}`
}

export async function saveDailyAnalysis(article: DailyAnalysis): Promise<DailyAnalysis> {
  assertWritableStorage()
  const backend = getStorageBackend()

  if (backend === "r2") {
    await putR2Object({
      key: r2ArticleKey(article.date),
      body: JSON.stringify(article, null, 2),
      contentType: "application/json",
    })
    return article
  }

  await fs.mkdir(CONTENT_DIR, { recursive: true })
  await fs.writeFile(articlePath(article.date), JSON.stringify(article, null, 2), "utf-8")
  return article
}

export async function getDailyAnalysisList(): Promise<DailyAnalysis[]> {
  const [localArticles, r2Articles] = await Promise.all([
    readLocalArticles(),
    isR2Configured() ? readR2Articles() : Promise.resolve([]),
  ])
  return mergeArticlesByDate(localArticles, r2Articles)
}

export async function getLatestDailyAnalysis(): Promise<DailyAnalysis | null> {
  const list = await getDailyAnalysisList()
  return list[0] ?? null
}

export async function getDailyAnalysisBySlug(slug: string): Promise<DailyAnalysis | null> {
  const list = await getDailyAnalysisList()
  return list.find((article) => article.slug === slug) ?? null
}

export async function getDailyAnalysisByDate(date: string): Promise<DailyAnalysis | null> {
  const list = await getDailyAnalysisList()
  return list.find((article) => article.date === date) ?? null
}

export async function deleteDailyAnalysis(date: string): Promise<void> {
  assertWritableStorage()
  const backend = getStorageBackend()

  if (backend === "r2") {
    try {
      await deleteR2Object(r2ArticleKey(date))
    } catch {
      // Article may not exist in R2.
    }
    return
  }

  try {
    await fs.unlink(articlePath(date))
  } catch {
    // File may not exist locally.
  }
}

async function appendR2Text(key: string, line: string): Promise<void> {
  let existing = ""
  try {
    existing = (await getR2ObjectText(key)) ?? ""
  } catch {
    // New log file for this key.
  }

  await putR2Object({
    key,
    body: existing + line,
    contentType: "text/plain",
  })
}

export async function appendDailyAnalysisLog(date: string, message: string): Promise<void> {
  assertWritableStorage()
  const line = `[${new Date().toISOString()}] ${message}\n`
  const backend = getStorageBackend()

  if (backend === "r2") {
    await appendR2Text(r2LogKey(date), line)
    return
  }

  await fs.mkdir(LOGS_DIR, { recursive: true })
  await fs.appendFile(path.join(LOGS_DIR, `${date}.log`), line, "utf-8")
}

function openAiErrorLogPath(date: string): string {
  return path.join(LOGS_DIR, `${date}${OPENAI_ERRORS_SUFFIX}`)
}

async function readR2OpenAiErrors(date: string): Promise<DailyAnalysisOpenAiErrorLog[]> {
  try {
    const parsed = await getR2ObjectJson<unknown>(r2OpenAiErrorLogKey(date))
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

  if (backend === "r2") {
    const existing = await readR2OpenAiErrors(date)
    existing.push(entry)
    await putR2Object({
      key: r2OpenAiErrorLogKey(date),
      body: JSON.stringify(existing, null, 2),
      contentType: "application/json",
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

export type AutomationLogEntry = {
  date: string
  source: "db" | "blob" | "r2"
  status: string
  telegramStatus?: string
  facebookStatus?: string
  errors?: unknown
  createdAt: string
  raw?: string
}

/** List file-based automation logs (R2 and/or local). Source label stays "blob" for local files for UI compatibility. */
export async function listBlobAutomationLogs(): Promise<AutomationLogEntry[]> {
  const entries: AutomationLogEntry[] = []

  if (isR2Configured()) {
    const objects = await listR2ObjectKeys(R2_LOGS_PREFIX)
    for (const object of objects) {
      if (!object.key.endsWith(".log")) continue
      const date = object.key.slice(R2_LOGS_PREFIX.length).replace(/\.log$/, "")
      try {
        const raw = (await getR2ObjectText(object.key)) ?? ""
        const lastLine = raw.trim().split("\n").filter(Boolean).pop() ?? ""
        entries.push({
          date,
          source: "r2",
          status: lastLine || "logged",
          createdAt: object.lastModified?.toISOString() ?? new Date().toISOString(),
          raw: lastLine,
        })
      } catch {
        entries.push({
          date,
          source: "r2",
          status: "unreadable",
          createdAt: new Date().toISOString(),
        })
      }
    }
  }

  try {
    const files = await fs.readdir(LOGS_DIR)
    for (const file of files) {
      if (!file.endsWith(".log")) continue
      const date = file.replace(/\.log$/, "")
      if (entries.some((e) => e.date === date && e.source === "r2")) continue
      const raw = await fs.readFile(path.join(LOGS_DIR, file), "utf-8")
      const lastLine = raw.trim().split("\n").filter(Boolean).pop() ?? ""
      entries.push({
        date,
        source: "blob",
        status: lastLine || "logged",
        createdAt: new Date().toISOString(),
        raw: lastLine,
      })
    }
  } catch {
    // No local logs directory.
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
