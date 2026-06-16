import { toTrend } from "@/lib/market-utils"

import {
  normalizePairQuotes,
  pairToLegDeltas,
  referencePairQuotes,
} from "./normalize-pairs"
import {
  CURRENCY_NAMES,
  MIN_PAIRS_PER_CURRENCY,
  MIN_STRENGTH_PAIRS,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
  type CurrencyStrengthScore,
  type CurrencyStrengthSnapshot,
  type FxPairQuote,
  type PairContribution,
  type RawFxPairQuote,
} from "./types"

const STRENGTH_BASE = 50
/** Scales zero-mean daily % contributions into a ~45–55 band for typical FX moves. */
const STRENGTH_SCALE = 12
const SNAPSHOT_POINTS = 2

type Accumulator = {
  deltaSum: number
  pairCount: number
  contributions: PairContribution[]
}

function emptyAccumulators(): Record<CurrencyCode, Accumulator> {
  const acc = {} as Record<CurrencyCode, Accumulator>
  for (const code of SUPPORTED_CURRENCIES) {
    acc[code] = { deltaSum: 0, pairCount: 0, contributions: [] }
  }
  return acc
}

function accumulateFromPairs(pairs: FxPairQuote[]): Record<CurrencyCode, Accumulator> {
  const acc = emptyAccumulators()

  for (const pair of pairs) {
    const { base, quote, baseDelta, quoteDelta } = pairToLegDeltas(pair)

    acc[base].deltaSum += baseDelta
    acc[base].pairCount += 1
    acc[base].contributions.push({ symbol: pair.symbol, delta: baseDelta })

    acc[quote].deltaSum += quoteDelta
    acc[quote].pairCount += 1
    acc[quote].contributions.push({ symbol: pair.symbol, delta: quoteDelta })
  }

  return acc
}

function averageDelta(acc: Accumulator): number {
  if (acc.pairCount === 0) return 0
  return Number((acc.deltaSum / acc.pairCount).toFixed(4))
}

function clampStrength(value: number): number {
  return Math.min(100, Math.max(0, value))
}

/**
 * Stable 1D snapshot series — flat line at current strength (no synthetic intraday waves).
 */
export function buildStrengthSeries(strength: number, _changePercent?: number): number[] {
  return Array.from({ length: SNAPSHOT_POINTS }, () =>
    Number(strength.toFixed(2)),
  )
}

const RANK_KEYS_BY_POSITION: Record<number, string> = {
  1: "strength.strongest",
  2: "strength.veryStrong",
}

function rankKeyForPosition(rank: number, total: number): string {
  if (rank <= 2) return RANK_KEYS_BY_POSITION[rank]

  const ratio = rank / total
  if (ratio <= 0.45) return "strength.strong"
  if (ratio <= 0.7) return "strength.neutral"
  if (ratio < 1) return "strength.weak"
  return "strength.weakest"
}

function assignRanks(scores: CurrencyStrengthScore[]): CurrencyStrengthScore[] {
  const sorted = [...scores].sort((a, b) => b.strength - a.strength)
  const rankByCode = new Map<CurrencyCode, number>()

  sorted.forEach((entry, index) => {
    rankByCode.set(entry.code, index + 1)
  })

  return scores.map((entry) => {
    const rank = rankByCode.get(entry.code) ?? scores.length
    return {
      ...entry,
      rank,
      rankKey: rankKeyForPosition(rank, scores.length),
    }
  })
}

/** Whether enough pair coverage exists for a trustworthy 8-currency snapshot. */
export function isStrengthSnapshotAvailable(
  pairs: FxPairQuote[],
  acc: Record<CurrencyCode, Accumulator>,
): boolean {
  if (pairs.length < MIN_STRENGTH_PAIRS) return false
  return SUPPORTED_CURRENCIES.every((code) => acc[code].pairCount >= MIN_PAIRS_PER_CURRENCY)
}

export function calculateCurrencyStrength(pairs: FxPairQuote[]): CurrencyStrengthScore[] {
  const acc = accumulateFromPairs(pairs)

  const activeCodes = SUPPORTED_CURRENCIES.filter((code) => acc[code].pairCount > 0)
  const avgDeltas = activeCodes.map((code) => ({
    code,
    avg: averageDelta(acc[code]),
  }))

  const mean =
    avgDeltas.length > 0
      ? avgDeltas.reduce((sum, row) => sum + row.avg, 0) / avgDeltas.length
      : 0

  const preliminary = SUPPORTED_CURRENCIES.map((code) => {
    const bucket = acc[code]
    const changePercent = bucket.pairCount > 0 ? averageDelta(bucket) : 0
    const normalizedContribution =
      bucket.pairCount > 0 ? (changePercent - mean) * STRENGTH_SCALE : 0
    const strength = clampStrength(
      Number((STRENGTH_BASE + normalizedContribution).toFixed(2)),
    )

    return {
      code,
      name: CURRENCY_NAMES[code],
      strength,
      changePercent,
      trend: toTrend(changePercent),
      rankKey: "strength.neutral",
      rank: 0,
      series: buildStrengthSeries(strength, changePercent),
      contributions: bucket.contributions,
      pairCount: bucket.pairCount,
    }
  })

  return assignRanks(preliminary)
}

export function buildCurrencyStrengthSnapshot(
  inputs: RawFxPairQuote[],
): CurrencyStrengthSnapshot {
  const pairs = normalizePairQuotes(inputs)
  const acc = accumulateFromPairs(pairs)
  const currencies = calculateCurrencyStrength(pairs)

  return {
    currencies,
    pairsUsed: pairs.map((p) => p.symbol),
    calculatedAt: new Date().toISOString(),
    available: isStrengthSnapshotAvailable(pairs, acc),
  }
}

/** Convenience entry using bundled reference pair quotes (explicit mock). */
export function calculateReferenceStrength(): CurrencyStrengthSnapshot {
  const pairs = referencePairQuotes()
  const acc = accumulateFromPairs(pairs)
  return {
    currencies: calculateCurrencyStrength(pairs),
    pairsUsed: pairs.map((p) => p.symbol),
    calculatedAt: new Date().toISOString(),
    available: isStrengthSnapshotAvailable(pairs, acc),
  }
}
