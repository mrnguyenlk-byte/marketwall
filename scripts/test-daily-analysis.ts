#!/usr/bin/env node
/**
 * Smoke test for daily analysis generation (OpenAI or mock fallback).
 * Usage: npm run daily:test | npm run daily:generate
 */
import dotenv from "dotenv"
import path from "path"
import { generateDailyAnalysis } from "@/lib/daily-analysis/generate"
import { hasOpenAiApiKey } from "@/lib/daily-analysis/openai-generator"
import { saveDailyAnalysis } from "@/lib/daily-analysis/storage"

dotenv.config({ path: ".env.local" })
dotenv.config()

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

async function main() {
  const date = todayIsoDate()
  const keyPresent = hasOpenAiApiKey()

  if (!keyPresent) {
    console.log("OPENAI_API_KEY not set — using mock generator")
  } else {
    console.log("OPENAI_API_KEY found — attempting OpenAI generation")
  }

  const { article, source, fallbackUsed, model } = await generateDailyAnalysis(date)
  const saved = await saveDailyAnalysis(article)
  const filePath = path.join(process.cwd(), "content", "daily-analysis", `${date}.json`)

  console.log("Daily analysis test — saved article")
  console.log("  source:", source)
  console.log("  fallbackUsed:", fallbackUsed)
  if (model) console.log("  model:", model)
  console.log("  date:", saved.date)
  console.log("  title:", saved.title)
  console.log("  slug:", saved.slug)
  console.log("  publishStatus:", saved.publishStatus)
  console.log("  summary:", saved.summary.slice(0, 120) + "...")
  if (saved.telegramCaption) {
    console.log("  telegramCaption:", saved.telegramCaption.slice(0, 80) + "...")
  }
  console.log("  file:", filePath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
