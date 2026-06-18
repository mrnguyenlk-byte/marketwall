/**
 * VPS `changePc` is magnitude-only (unsigned). Sign from current price vs reference close (`r`).
 */

/** Normalize VPS price fields (lastPrice in thousands, closePrice/r in VND). */
export function vpsPriceToVnd(raw: number | string | undefined | null): number | null {
  if (raw == null || raw === "") return null
  const n = typeof raw === "string" ? Number(raw) : raw
  if (!Number.isFinite(n) || n <= 0) return null
  if (n < 1000) return n * 1000
  return n
}

/**
 * Signed % change from current vs reference price.
 * If currentPrice > referencePrice → positive; if lower → negative; equal → 0.
 */
export function computeVnChangePercent(price: number, referencePrice: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(referencePrice) || referencePrice <= 0) {
    return 0
  }
  if (price === referencePrice) return 0
  return Number((((price - referencePrice) / referencePrice) * 100).toFixed(2))
}

/** Legacy heuristic when reference price is unavailable — do not use when `r` exists. */
export function signVnChangePercent(price: number, unsignedChangePercent: number): number {
  const mag = Math.abs(unsignedChangePercent)
  if (!Number.isFinite(price) || price <= 0 || mag === 0) return 0

  const refUp = price / (1 + mag / 100)
  const refDown = price / (1 - mag / 100)
  const recomputedUp = ((price - refUp) / refUp) * 100
  const recomputedDown = ((price - refDown) / refDown) * 100
  const diffUp = Math.abs(Math.abs(recomputedUp) - mag)
  const diffDown = Math.abs(Math.abs(recomputedDown) - mag)

  const signed = diffUp <= diffDown ? mag : -mag
  return Number(signed.toFixed(2))
}

/** Resolve signed % — prefer reference price; never Math.abs on the final value. */
export function resolveVnChangePercent(
  price: number,
  options: {
    referencePrice?: number | null
    rawChangePercent?: number
    /** VPS `changePc` magnitude when reference price is unavailable. */
    unsignedMagnitude?: boolean
  },
): number {
  if (price > 0 && options.referencePrice != null && options.referencePrice > 0) {
    return computeVnChangePercent(price, options.referencePrice)
  }
  const raw = options.rawChangePercent ?? 0
  if (!options.unsignedMagnitude) {
    return Number(raw.toFixed(2))
  }
  if (raw < 0) return Number(raw.toFixed(2))
  return signVnChangePercent(price, raw)
}

export function signVnChangeAmount(price: number, signedChangePercent: number): number {
  return Number(((price * signedChangePercent) / 100).toFixed(2))
}

/** Map signed change to heatmap color label for debug output. */
export function heatmapColorLabel(changePercent: number): "green" | "red" | "neutral" {
  if (changePercent > 0) return "green"
  if (changePercent < 0) return "red"
  return "neutral"
}
