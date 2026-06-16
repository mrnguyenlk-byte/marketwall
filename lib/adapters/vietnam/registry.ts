import "server-only"

import { logVietnamAdapterResult } from "@/lib/providers/provider-diagnostics"
import type { AdapterFetchResult, NormalizedVietnamMarket, VietnamAdapterId, VietnamMarketAdapter } from "./types"
import { fireantAdapter } from "./fireant-adapter"
import { kbsAdapter } from "./kbs-adapter"
import { tcbsAdapter } from "./tcbs-adapter"
import { vpsAdapter } from "./vps-adapter"
import { vietstockAdapter } from "./vietstock-adapter"

/** VPS primary for heatmap; KBS secondary (indices, foreign flow, fallback quotes). */
export const VIETNAM_ADAPTER_PRIORITY: VietnamAdapterId[] = [
  "vps",
  "kbs",
  "tcbs",
  "vietstock",
  "fireant",
]

export const VIETNAM_ADAPTERS: Record<VietnamAdapterId, VietnamMarketAdapter> = {
  vps: vpsAdapter,
  kbs: kbsAdapter,
  fireant: fireantAdapter,
  vietstock: vietstockAdapter,
  tcbs: tcbsAdapter,
}

export function getVietnamAdapter(id: VietnamAdapterId): VietnamMarketAdapter {
  return VIETNAM_ADAPTERS[id]
}

export function listVietnamAdapters(): VietnamMarketAdapter[] {
  return VIETNAM_ADAPTER_PRIORITY.map((id) => VIETNAM_ADAPTERS[id])
}

/**
 * Try Vietnam adapters in priority order; returns first successful snapshot.
 */
export async function fetchVietnamMarketFromAdapters(): Promise<
  AdapterFetchResult<NormalizedVietnamMarket>
> {
  let lastError: AdapterFetchResult<NormalizedVietnamMarket> | null = null

  for (const id of VIETNAM_ADAPTER_PRIORITY) {
    const adapter = VIETNAM_ADAPTERS[id]
    if (!adapter.isConfigured()) continue

    const result = await adapter.fetchMarketSnapshot()
    if (result.status === "ok") {
      logVietnamAdapterResult(id, {
        status: result.status,
        indices: result.data.indices.length,
        stocks:
          result.data.stocks.hose.length +
          result.data.stocks.hnx.length +
          result.data.stocks.upcom.length,
      })
      return result
    }
    logVietnamAdapterResult(id, {
      status: result.status,
      message:
        "message" in result
          ? result.message
          : "reason" in result
            ? result.reason
            : undefined,
    })
    lastError = result
  }

  if (lastError) return lastError

  return {
    status: "not_configured",
    provider: VIETNAM_ADAPTER_PRIORITY[0],
    reason: "No Vietnam adapter enabled",
  }
}
