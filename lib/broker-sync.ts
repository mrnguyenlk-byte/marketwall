import type { Broker } from "./market-data"

/**
 * Placeholder for future broker auto-sync from website URL.
 * When implemented, fetch metadata (spread, deposit, platforms, rating)
 * from broker.websiteUrl and merge into Broker records.
 */
export async function syncBrokerFromUrl(_url: string): Promise<Partial<Broker> | null> {
  return null
}
