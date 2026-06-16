import "server-only"

import { roundScore } from "@/lib/fear-greed/normalize"
import { safeFetchJson } from "@/lib/providers/fetch-utils"

const FNG_URL = "https://api.alternative.me/fng/?limit=1"

type AlternativeMeResponse = {
  data?: Array<{ value?: string; value_classification?: string }>
  metadata?: { error?: string | null }
}

/** Crypto Fear & Greed from Alternative.me (0–100). */
export async function fetchCryptoFearGreed(): Promise<number | null> {
  const json = await safeFetchJson<AlternativeMeResponse>(FNG_URL, { cache: "no-store" })
  const raw = json?.data?.[0]?.value
  if (raw == null) return null

  const value = Number(raw)
  if (!Number.isFinite(value)) return null
  return roundScore(value)
}
