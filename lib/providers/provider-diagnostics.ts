import "server-only"

/** Truncate and redact provider log payloads (never log API keys). */
export function truncateMessage(message: string, max = 160): string {
  return message.length <= max ? message : `${message.slice(0, max)}…`
}

export function logTwelveDataError(
  context: string,
  detail: { code?: number; message?: string; symbols?: string; batchSize?: number },
): void {
  console.warn(
    `[provider:twelvedata] context=${context} code=${detail.code ?? "unknown"} batch=${detail.batchSize ?? "?"} symbols=${detail.symbols ?? "?"} message=${truncateMessage(detail.message ?? "Twelve Data request failed")}`,
  )
}

export function logTwelveDataBatchResult(
  context: string,
  detail: { requested: number; parsed: number; rateLimited: boolean },
): void {
  console.log(
    `[provider:twelvedata] context=${context} requested=${detail.requested} parsed=${detail.parsed} rateLimited=${detail.rateLimited}`,
  )
}

export function logVietnamAdapterResult(
  adapterId: string,
  detail: { status: string; indices?: number; stocks?: number; message?: string },
): void {
  console.warn(
    `[provider:vietnam:${adapterId}] status=${detail.status} indices=${detail.indices ?? 0} stocks=${detail.stocks ?? 0} message=${truncateMessage(detail.message ?? "")}`,
  )
}

export function logProviderFallback(
  provider: string,
  reason: string,
  detail?: Record<string, string | number | boolean>,
): void {
  const extras = detail
    ? ` ${Object.entries(detail)
        .map(([key, value]) => `${key}=${value}`)
        .join(" ")}`
    : ""
  console.warn(`[provider:fallback] provider=${provider} reason=${truncateMessage(reason)}${extras}`)
}

export function logForexPairsProvider(detail: {
  keyConfigured: boolean
  pairCount: number
  reason?: string
}): void {
  console.log(
    `[provider:forex-pairs] keyConfigured=${detail.keyConfigured} pairCount=${detail.pairCount}${detail.reason ? ` reason=${detail.reason}` : ""}`,
  )
}
