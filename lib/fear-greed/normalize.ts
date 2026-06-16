/** Shared 0–100 normalization helpers for Fear & Greed composites. */

export function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value))
}

export function roundScore(value: number): number {
  return Math.round(clampScore(value))
}

/**
 * Map a bounded input range linearly to 0–100.
 * Values below `min` → 0, above `max` → 100.
 */
export function linearToScore(value: number, min: number, max: number): number {
  if (max <= min) return 50
  const ratio = (value - min) / (max - min)
  return roundScore(ratio * 100)
}

/**
 * Center-neutral momentum: 0% change → 50, ±`halfRange`% → 0/100.
 * Default halfRange 10 → -10% = 0, +10% = 100, slope 5 pts per 1%.
 */
export function momentumToScore(changePercent: number, halfRange = 10): number {
  const slope = 50 / halfRange
  return roundScore(50 + changePercent * slope)
}

/** Weighted average of component scores (weights should sum to 1). */
export function weightedComposite(
  components: Array<{ score: number; weight: number }>,
): number {
  const active = components.filter((c) => Number.isFinite(c.score))
  if (active.length === 0) return 50

  const weightSum = active.reduce((sum, c) => sum + c.weight, 0)
  if (weightSum <= 0) return 50

  const total = active.reduce((sum, c) => sum + c.score * c.weight, 0)
  return roundScore(total / weightSum)
}
