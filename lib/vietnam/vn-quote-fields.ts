import { VPS_VOLUME_UNIT, vpsLotToShares, vpsTradingValue } from "@/lib/vietnam/volume-units"

export type VnQuoteVolumeFields = {
  /** VPS lot count (legacy `volume` field). */
  volume: number
  volumeLot: number
  volumeShares: number
  volumeUnit: typeof VPS_VOLUME_UNIT
  tradingValue: number
}

export function enrichVnQuoteVolume(price: number, volumeLots: number): VnQuoteVolumeFields {
  const lots = Math.max(0, volumeLots)
  return {
    volume: lots,
    volumeLot: lots,
    volumeShares: vpsLotToShares(lots),
    volumeUnit: VPS_VOLUME_UNIT,
    tradingValue: vpsTradingValue(price, lots),
  }
}

export type VnForeignFlowFields = {
  foreignBuy: number
  foreignSell: number
  foreignNet: number
  foreignBuyValue: number
  foreignSellValue: number
  foreignNetValue: number
}

export function enrichVnForeignFlow(
  price: number,
  foreignBuyShares: number,
  foreignSellShares: number,
): VnForeignFlowFields {
  const buy = Math.max(0, foreignBuyShares)
  const sell = Math.max(0, foreignSellShares)
  const foreignBuyValue = Math.round(buy * price)
  const foreignSellValue = Math.round(sell * price)
  return {
    foreignBuy: buy,
    foreignSell: sell,
    foreignNet: buy - sell,
    foreignBuyValue,
    foreignSellValue,
    foreignNetValue: foreignBuyValue - foreignSellValue,
  }
}
