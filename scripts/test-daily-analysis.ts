#!/usr/bin/env node
/**
 * Smoke test for daily analysis automation storage (Phase 1 mock).
 * Usage: npm run daily:test
 */
import path from "path"
import { generateMockDailyAnalysis } from "@/lib/daily-analysis/generator"
import { saveDailyAnalysis } from "@/lib/daily-analysis/storage"

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

async function main() {
  const date = todayIsoDate()
  const article = generateMockDailyAnalysis(date)
  const saved = await saveDailyAnalysis(article)
  const filePath = path.join(process.cwd(), "content", "daily-analysis", `${date}.json`)

  console.log("Daily analysis test — saved mock article")
  console.log("  date:", saved.date)
  console.log("  title:", saved.title)
  console.log("  slug:", saved.slug)
  console.log("  publishStatus:", saved.publishStatus)
  console.log("  summary:", saved.summary.slice(0, 120) + "...")
  console.log("  file:", filePath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
