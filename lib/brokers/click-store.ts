import "server-only"

import { randomUUID } from "crypto"
import { appendFile, mkdir } from "fs/promises"
import path from "path"

import type { BrokerClickLog } from "@/types/broker"

const CLICKS_DIR = path.join(process.cwd(), "data")
const CLICKS_FILE = path.join(CLICKS_DIR, "broker-clicks.jsonl")

export type LogBrokerClickInput = {
  slug: string
  referer?: string
  userAgent?: string
  source?: string
  campaign?: string
}

/** Append a broker outbound click event (file-based; no Postgres required). */
export async function logBrokerClick(input: LogBrokerClickInput): Promise<BrokerClickLog> {
  const event: BrokerClickLog = {
    id: randomUUID(),
    slug: input.slug,
    timestamp: new Date().toISOString(),
    referer: input.referer,
    userAgent: input.userAgent,
    source: input.source,
    campaign: input.campaign,
  }

  try {
    await mkdir(CLICKS_DIR, { recursive: true })
    await appendFile(CLICKS_FILE, `${JSON.stringify(event)}\n`, "utf8")
  } catch {
    /* read-only or serverless FS — click still returns for redirect */
  }

  return event
}
