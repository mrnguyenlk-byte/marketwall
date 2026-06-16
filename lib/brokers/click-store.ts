import "server-only"

import { randomUUID } from "crypto"

import { prisma } from "@/lib/prisma"
import type { BrokerClickLog } from "@/types/broker"

export type LogBrokerClickInput = {
  slug: string
  referer?: string
  userAgent?: string
  source?: string
  campaign?: string
}

function toClickLog(row: {
  id: string
  slug: string
  timestamp: Date
  referer: string | null
  userAgent: string | null
  source: string | null
  campaign: string | null
}): BrokerClickLog {
  return {
    id: row.id,
    slug: row.slug,
    timestamp: row.timestamp.toISOString(),
    referer: row.referer ?? undefined,
    userAgent: row.userAgent ?? undefined,
    source: row.source ?? undefined,
    campaign: row.campaign ?? undefined,
  }
}

function fallbackClickLog(input: LogBrokerClickInput): BrokerClickLog {
  return {
    id: randomUUID(),
    slug: input.slug,
    timestamp: new Date().toISOString(),
    referer: input.referer,
    userAgent: input.userAgent,
    source: input.source,
    campaign: input.campaign,
  }
}

/** Persist a broker outbound click event (PostgreSQL via Prisma). */
export async function logBrokerClick(input: LogBrokerClickInput): Promise<BrokerClickLog> {
  try {
    const row = await prisma.brokerClick.create({
      data: {
        slug: input.slug,
        referer: input.referer,
        userAgent: input.userAgent,
        source: input.source,
        campaign: input.campaign,
      },
    })
    return toClickLog(row)
  } catch {
    /* DB unavailable — redirect / API still succeed with synthetic id */
    return fallbackClickLog(input)
  }
}
