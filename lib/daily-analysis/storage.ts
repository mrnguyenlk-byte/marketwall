import fs from "fs/promises"
import path from "path"
import type { DailyAnalysis, DailyAnalysisOpenAiErrorLog } from "./types"

const CONTENT_DIR = path.join(process.cwd(), "content", "daily-analysis")
const LOGS_DIR = path.join(CONTENT_DIR, "logs")

const DATE_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}\.json$/

function articlePath(date: string): string {
  return path.join(CONTENT_DIR, `${date}.json`)
}

export async function saveDailyAnalysis(article: DailyAnalysis): Promise<DailyAnalysis> {
  await fs.mkdir(CONTENT_DIR, { recursive: true })
  await fs.writeFile(articlePath(article.date), JSON.stringify(article, null, 2), "utf-8")
  return article
}

export async function getDailyAnalysisList(): Promise<DailyAnalysis[]> {
  try {
    await fs.mkdir(CONTENT_DIR, { recursive: true })
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

    return articles.sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

export async function getLatestDailyAnalysis(): Promise<DailyAnalysis | null> {
  const list = await getDailyAnalysisList()
  return list[0] ?? null
}

export async function getDailyAnalysisBySlug(slug: string): Promise<DailyAnalysis | null> {
  const list = await getDailyAnalysisList()
  return list.find((article) => article.slug === slug) ?? null
}

export async function appendDailyAnalysisLog(date: string, message: string): Promise<void> {
  await fs.mkdir(LOGS_DIR, { recursive: true })
  const line = `[${new Date().toISOString()}] ${message}\n`
  await fs.appendFile(path.join(LOGS_DIR, `${date}.log`), line, "utf-8")
}

function openAiErrorLogPath(date: string): string {
  return path.join(LOGS_DIR, `${date}.json`)
}

/** Append OpenAI failure entries to content/daily-analysis/logs/YYYY-MM-DD.json */
export async function logDailyAnalysisOpenAiError(
  date: string,
  entry: DailyAnalysisOpenAiErrorLog,
): Promise<void> {
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
