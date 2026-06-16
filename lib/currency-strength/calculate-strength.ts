import { toTrend } from "@/lib/market-utils"

import {
  normalizePairQuotes,
  pairToLegDeltas,
  referencePairQuotes,
} from "./normalize-pairs"
import {
  CURRENCY_NAMES,
  DEGRADED_STRENGTH_PAIRS,
  IDEAL_STRENGTH_PAIRS,
  SUPPORTED_CURRENCIES,
  VALID_STRENGTH_PAIRS,
  type CurrencyCode,
  type CurrencyStrengthScore,
  type CurrencyStrengthSnapshot,
  type FxPairQuote,
  type PairContribution,
  type RawFxPairQuote,
  type StrengthCoverage,
} from "./types"

const STRENGTH_BASE = 50
/** Z-score multiplier — typical readings stay in 40–60; extremes >70 or <30 are rare. */
const Z_SCORE_SCALE = 10
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

function populationStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
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

/** Map raw pair count to soft coverage tier. */
export function resolveStrengthCoverage(pairCount: number): StrengthCoverage {
  if (pairCount >= IDEAL_STRENGTH_PAIRS) return "ideal"
  if (pairCount >= VALID_STRENGTH_PAIRS) return "valid"
  if (pairCount >= DEGRADED_STRENGTH_PAIRS) return "degraded"
  return "unavailable"
}

/** Whether enough pair coverage exists to display a strength snapshot. */
export function isStrengthSnapshotAvailable(pairs: FxPairQuote[]): boolean {
  return resolveStrengthCoverage(pairs.length) !== "unavailable"
}

export function calculateCurrencyStrength(pairs: FxPairQuote[]): CurrencyStrengthScore[] {
  const acc = accumulateFromPairs(pairs)

  const rawScores = SUPPORTED_CURRENCIES.map((code) => ({
    code,
    rawScore: acc[code].pairCount > 0 ? averageDelta(acc[code]) : 0,
  }))

  const activeRawScores = rawScores
    .filter(({ code }) => acc[code].pairCount > 0)
    .map(({ rawScore }) => rawScore)

  const mean =
    activeRawScores.length > 0
      ? activeRawScores.reduce((sum, value) => sum + value, 0) / activeRawScores.length
      : 0

  const stdDev = populationStdDev(activeRawScores, mean)

  const preliminary = SUPPORTED_CURRENCIES.map((code) => {
    const bucket = acc[code]
    const changePercent = bucket.pairCount > 0 ? averageDelta(bucket) : 0
    const rawScore = bucket.pairCount > 0 ? changePercent : 0
    const zScore = stdDev > 0 ? (rawScore - mean) / stdDev : 0
    const strength = clampStrength(
      Number((STRENGTH_BASE + zScore * Z_SCORE_SCALE).toFixed(2)),
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
  const currencies = calculateCurrencyStrength(pairs)

  return {
    currencies,
    pairsUsed: pairs.map((p) => p.symbol),
    calculatedAt: new Date().toISOString(),
    available: isStrengthSnapshotAvailable(pairs),
  }
}

/** Convenience entry using bundled reference pair quotes (explicit mock). */
export function calculateReferenceStrength(): CurrencyStrengthSnapshot {
  const pairs = referencePairQuotes()
  return {
    currencies: calculateCurrencyStrength(pairs),
    pairsUsed: pairs.map((p) => p.symbol),
    calculatedAt: new Date().toISOString(),
    available: isStrengthSnapshotAvailable(pairs),
  }
}
