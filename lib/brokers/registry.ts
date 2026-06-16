import { brokers, type Broker } from "@/lib/broker-data"
import type { BrokerRecord } from "@/types/broker"

/** URL-safe slug from broker display name. */
export function brokerSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toRecord(broker: Broker): BrokerRecord {
  return {
    ...broker,
    slug: brokerSlug(broker.name),
  }
}

const records: BrokerRecord[] = brokers.map(toRecord)

const bySlug = new Map(records.map((b) => [b.slug, b]))
const byName = new Map(records.map((b) => [b.name.toLowerCase(), b]))

export function getAllBrokers(): BrokerRecord[] {
  return records
}

export function findBrokerBySlug(slug: string): BrokerRecord | undefined {
  const normalized = slug.trim().toLowerCase()
  return bySlug.get(normalized) ?? byName.get(normalized.replace(/-/g, " "))
}

export function getBrokerStaticParams(): { slug: string }[] {
  return records.map((b) => ({ slug: b.slug }))
}

export function parseComparePair(
  pair: string,
): { leftSlug: string; rightSlug: string } | null {
  const decoded = decodeURIComponent(pair).trim()
  const match = decoded.match(/^(.+)-vs-(.+)$/i)
  if (!match) return null
  return {
    leftSlug: match[1].trim().toLowerCase(),
    rightSlug: match[2].trim().toLowerCase(),
  }
}

export function getCompareStaticParams(): { pair: string }[] {
  const pairs: { pair: string }[] = []
  const featured = records.filter((b) => b.featured)
  for (let i = 0; i < featured.length; i++) {
    for (let j = i + 1; j < featured.length; j++) {
      pairs.push({ pair: `${featured[i].slug}-vs-${featured[j].slug}` })
    }
  }
  return pairs
}
