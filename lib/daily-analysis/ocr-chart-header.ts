import "server-only"

import OpenAI from "openai"
import sharp from "sharp"
import {
  computePointChange,
  computePreviousClose,
  type AmiBrokerOcrRow,
} from "./market-data"
import { getDailyAnalysisOpenAiModel, hasOpenAiApiKey } from "./openai-generator"

const HEADER_CROP_RATIO = 0.14

const OCR_SYSTEM_PROMPT = `You extract numeric market data from AmiBroker chart header screenshots.
Rules:
- ONLY read numbers that are clearly visible in the image.
- NEVER invent, estimate, or guess any number.
- If a field is unreadable or not visible, return null for that field.
- Ignore volume, liquidity, and any fields not listed in the schema.
- Parse numbers without thousands separators (e.g. 1,234.5 → 1234.5).
- changePercent is the percentage change shown in the header (may include + or - sign in the image).
- Return valid JSON only.`

function buildOcrUserPrompt(label: "vnindex" | "gold"): string {
  const symbolHint =
    label === "vnindex"
      ? "Expected symbol: VNINDEX or VN-Index."
      : "Expected symbol: GOLD, XAUUSD, or similar gold quote."
  return `Extract market data from this AmiBroker chart header image (${label}).
${symbolHint}
Return JSON with exactly these fields:
{
  "symbol": string,
  "open": number | null,
  "high": number | null,
  "low": number | null,
  "close": number | null,
  "changePercent": number | null
}`
}

export type DailyAnalysisOcrResult = {
  vnindex: AmiBrokerOcrRow | null
  gold: AmiBrokerOcrRow | null
  vnindexSuccess: boolean
  goldSuccess: boolean
}

function parseOcrNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").replace(/%/g, "").trim()
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function parseOcrRow(raw: unknown): AmiBrokerOcrRow | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  return {
    symbol: typeof record.symbol === "string" ? record.symbol.trim() : "",
    open: parseOcrNumber(record.open),
    high: parseOcrNumber(record.high),
    low: parseOcrNumber(record.low),
    close: parseOcrNumber(record.close),
    changePercent: parseOcrNumber(record.changePercent),
  }
}

function isOcrSuccess(row: AmiBrokerOcrRow | null): boolean {
  return row != null && row.close != null
}

function ocrRowWithDerivedValues(row: AmiBrokerOcrRow | null) {
  if (!row || row.close == null) return row
  const previousClose =
    row.changePercent != null ? computePreviousClose(row.close, row.changePercent) : null
  const pointChange =
    row.changePercent != null ? computePointChange(row.close, row.changePercent) : null
  return { ...row, previousClose, pointChange }
}

/** Crop the top header band of an AmiBroker chart screenshot. */
export async function cropHeader(buffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  if (width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions for header crop")
  }

  const cropHeight = Math.max(1, Math.round(height * HEADER_CROP_RATIO))
  return sharp(buffer)
    .extract({ left: 0, top: 0, width, height: cropHeight })
    .png()
    .toBuffer()
}

/** Extract AmiBroker header numbers from a cropped chart image via OpenAI vision. */
export async function extractAmiBrokerHeaderOcr(
  buffer: Buffer,
  label: "vnindex" | "gold",
): Promise<AmiBrokerOcrRow | null> {
  if (!hasOpenAiApiKey()) {
    console.log("[daily-analysis] OCR_FAILED", { label, reason: "missing_openai_api_key" })
    return null
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const cropped = await cropHeader(buffer)
  const base64 = cropped.toString("base64")
  const client = new OpenAI({ apiKey })
  const model = getDailyAnalysisOpenAiModel()

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: OCR_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: buildOcrUserPrompt(label) },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${base64}` },
            },
          ],
        },
      ],
    })

    const messageContent = completion.choices[0]?.message?.content
    if (!messageContent) {
      console.log("[daily-analysis] OCR_FAILED", { label, reason: "empty_response" })
      return null
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(messageContent)
    } catch {
      console.log("[daily-analysis] OCR_FAILED", { label, reason: "invalid_json" })
      return null
    }

    const row = parseOcrRow(parsed)
    if (!row) {
      console.log("[daily-analysis] OCR_FAILED", { label, reason: "schema_parse" })
      return null
    }

    if (isOcrSuccess(row)) {
      console.log("[daily-analysis] OCR_SUCCESS", { label, symbol: row.symbol })
      console.log(
        "[daily-analysis] OCR_VALUES",
        JSON.stringify({ label, row: ocrRowWithDerivedValues(row) }),
      )
    } else {
      console.log("[daily-analysis] OCR_FAILED", {
        label,
        reason: "close_null",
        row,
      })
    }

    return row
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log("[daily-analysis] OCR_FAILED", { label, reason: message })
    return null
  }
}

/** Run OCR on VN-Index and Gold AmiBroker chart screenshots. */
export async function extractDailyAnalysisOcr(input: {
  vnindexBuffer: Buffer
  goldBuffer: Buffer
}): Promise<DailyAnalysisOcrResult> {
  console.log("[daily-analysis] OCR_START")

  const [vnindex, gold] = await Promise.all([
    extractAmiBrokerHeaderOcr(input.vnindexBuffer, "vnindex"),
    extractAmiBrokerHeaderOcr(input.goldBuffer, "gold"),
  ])

  const result: DailyAnalysisOcrResult = {
    vnindex,
    gold,
    vnindexSuccess: isOcrSuccess(vnindex),
    goldSuccess: isOcrSuccess(gold),
  }

  console.log(
    "[daily-analysis] OCR_VALUES",
    JSON.stringify({
      vnindexSuccess: result.vnindexSuccess,
      goldSuccess: result.goldSuccess,
      vnindex: ocrRowWithDerivedValues(result.vnindex),
      gold: ocrRowWithDerivedValues(result.gold),
    }),
  )

  return result
}

/** Fetch image bytes from an absolute URL or site-relative upload path. */
export async function fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    if (imageUrl.startsWith("/")) {
      const fs = await import("node:fs/promises")
      const path = await import("node:path")
      const filePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""))
      return await fs.readFile(filePath)
    }

    const response = await fetch(imageUrl)
    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

/** Resolve OCR from optional image buffers (automation/admin uploads or URL fetch). */
export async function resolveDailyAnalysisOcr(input: {
  vnindexBuffer?: Buffer | null
  goldBuffer?: Buffer | null
}): Promise<DailyAnalysisOcrResult | null> {
  if (!input.vnindexBuffer || !input.goldBuffer) return null
  return extractDailyAnalysisOcr({
    vnindexBuffer: input.vnindexBuffer,
    goldBuffer: input.goldBuffer,
  })
}
