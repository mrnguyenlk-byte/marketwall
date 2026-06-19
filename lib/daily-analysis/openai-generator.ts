import OpenAI from "openai"
import {
  countDailyAnalysisBodyWords,
  DAILY_ANALYSIS_BODY_WORD_LIMIT,
  DAILY_ANALYSIS_SYSTEM_PROMPT,
  appendDailyAnalysisDisclaimer,
  buildDailyAnalysisCta,
  buildDailyAnalysisUserPrompt,
  type DailyAnalysisPromptInput,
} from "./prompt"
import { generateDailyAnalysisSlug } from "./slug"
import type { DailyAnalysis, DailyAnalysisOpenAiContent } from "./types"

const DEFAULT_MODEL = "gpt-4o-mini"
const OPENAI_CONTENT_FIELDS: (keyof DailyAnalysisOpenAiContent)[] = [
  "title",
  "summary",
  "vnindexAnalysis",
  "goldAnalysis",
  "usMacroSummary",
  "watchNext",
  "telegramCaption",
  "facebookCaption",
  "zaloMessage",
]

export type OpenAiGeneratorInput = DailyAnalysisPromptInput & {
  vnindexImage: string
  goldImage: string
}

function defaultVnindexImage(date: string): string {
  return `/uploads/daily-analysis/${date}/vnindex.png`
}

function defaultGoldImage(date: string): string {
  return `/uploads/daily-analysis/${date}/gold.png`
}

export function getDailyAnalysisOpenAiModel(): string {
  return process.env.DAILY_ANALYSIS_OPENAI_MODEL?.trim() || DEFAULT_MODEL
}

export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function readWatchNext(record: Record<string, unknown>): string | null {
  if (isNonEmptyString(record.watchNext)) return record.watchNext.trim()
  if (isNonEmptyString(record.cta)) return record.cta.trim()
  return null
}

export function validateDailyAnalysisBodyWordCount(
  content: Pick<
    DailyAnalysisOpenAiContent,
    "vnindexAnalysis" | "goldAnalysis" | "usMacroSummary" | "watchNext"
  >,
): boolean {
  return countDailyAnalysisBodyWords(content) <= DAILY_ANALYSIS_BODY_WORD_LIMIT
}

export function parseAndValidateOpenAiContent(raw: unknown): DailyAnalysisOpenAiContent | null {
  if (!raw || typeof raw !== "object") return null

  const record = raw as Record<string, unknown>
  for (const field of OPENAI_CONTENT_FIELDS) {
    if (field === "watchNext") {
      if (!readWatchNext(record)) return null
      continue
    }
    if (!isNonEmptyString(record[field])) return null
  }

  const watchNext = readWatchNext(record)
  if (!watchNext) return null

  const content: DailyAnalysisOpenAiContent = {
    title: (record.title as string).trim(),
    summary: (record.summary as string).trim(),
    vnindexAnalysis: (record.vnindexAnalysis as string).trim(),
    goldAnalysis: (record.goldAnalysis as string).trim(),
    usMacroSummary: (record.usMacroSummary as string).trim(),
    watchNext,
    telegramCaption: (record.telegramCaption as string).trim(),
    facebookCaption: (record.facebookCaption as string).trim(),
    zaloMessage: (record.zaloMessage as string).trim(),
  }

  if (!validateDailyAnalysisBodyWordCount(content)) return null

  return sanitizeDailyAnalysisOpenAiContent(content)
}

/** Ensure disclaimer on social captions even if the model omits it. */
export function sanitizeDailyAnalysisOpenAiContent(
  content: DailyAnalysisOpenAiContent,
): DailyAnalysisOpenAiContent {
  return {
    ...content,
    telegramCaption: appendDailyAnalysisDisclaimer(content.telegramCaption),
    facebookCaption: appendDailyAnalysisDisclaimer(content.facebookCaption),
  }
}

export function buildDailyAnalysisFromOpenAiContent(
  date: string,
  content: DailyAnalysisOpenAiContent,
  vnindexImage: string,
  goldImage: string,
): DailyAnalysis {
  const now = new Date().toISOString()
  const slug = generateDailyAnalysisSlug(content.title, date)

  return {
    date,
    title: content.title,
    slug,
    summary: content.summary,
    vnindexAnalysis: content.vnindexAnalysis,
    goldAnalysis: content.goldAnalysis,
    usMacroSummary: content.usMacroSummary,
    cta: buildDailyAnalysisCta(content.watchNext),
    telegramCaption: content.telegramCaption,
    facebookCaption: content.facebookCaption,
    zaloMessage: content.zaloMessage,
    vnindexImage,
    goldImage,
    webUrl: `/daily-analysis/${slug}`,
    publishStatus: "draft",
    createdAt: now,
    updatedAt: now,
  }
}

export async function fetchOpenAiDailyContent(
  input: OpenAiGeneratorInput,
): Promise<DailyAnalysisOpenAiContent> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured")
  }

  const model = getDailyAnalysisOpenAiModel()
  const client = new OpenAI({ apiKey })

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DAILY_ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: buildDailyAnalysisUserPrompt(input) },
    ],
    temperature: 0.6,
  })

  const messageContent = completion.choices[0]?.message?.content
  if (!messageContent) {
    throw new Error("OpenAI returned empty content")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(messageContent)
  } catch {
    throw new Error("OpenAI response is not valid JSON")
  }

  const validated = parseAndValidateOpenAiContent(parsed)
  if (!validated) {
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>
      const watchNext = readWatchNext(record)
      if (watchNext) {
        const body = {
          vnindexAnalysis: String(record.vnindexAnalysis ?? "").trim(),
          goldAnalysis: String(record.goldAnalysis ?? "").trim(),
          usMacroSummary: String(record.usMacroSummary ?? "").trim(),
          watchNext,
        }
        if (!validateDailyAnalysisBodyWordCount(body)) {
          throw new Error(
            `OpenAI response exceeded ${DAILY_ANALYSIS_BODY_WORD_LIMIT}-word body limit (${countDailyAnalysisBodyWords(body)} words)`,
          )
        }
      }
    }
    throw new Error("OpenAI response failed schema validation")
  }

  return validated
}

export async function generateOpenAiDailyAnalysis(
  date: string,
  vnindexImage?: string,
  goldImage?: string,
  usMacroDataText?: string,
  usEventsText?: string,
  usEventsCalendarChecked?: boolean,
): Promise<DailyAnalysis> {
  const vnImage = vnindexImage ?? defaultVnindexImage(date)
  const gImage = goldImage ?? defaultGoldImage(date)

  const content = await fetchOpenAiDailyContent({
    date,
    vnindexImage: vnImage,
    goldImage: gImage,
    usMacroDataText,
    usEventsText,
    usEventsCalendarChecked,
  })

  return buildDailyAnalysisFromOpenAiContent(date, content, vnImage, gImage)
}
