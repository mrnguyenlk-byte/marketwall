/**
 * VPS `changePc` is magnitude-only (unsigned). Infer signed % from price vs reference close.
 */
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

export function signVnChangeAmount(price: number, signedChangePercent: number): number {
  return Number(((price * signedChangePercent) / 100).toFixed(2))
}
