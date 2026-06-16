/** VPS `lot` / `fBVol` / `fSVolume` fields count 10-share lots (HOSE convention). */
export const VPS_SHARES_PER_LOT = 10

export const VPS_VOLUME_UNIT = "lot10" as const

export type VpsVolumeUnit = typeof VPS_VOLUME_UNIT

export function vpsLotToShares(lots: number): number {
  return lots * VPS_SHARES_PER_LOT
}

/** Trading value (GTGD) in VND when volume is VPS lot count. */
export function vpsTradingValue(price: number, volumeLots: number): number {
  return Math.round(price * volumeLots * VPS_SHARES_PER_LOT)
}
