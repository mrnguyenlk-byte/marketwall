/** Shared broker promotion / rebate policy options for admin CMS + public badges. */

export const BACKCOM_PERCENT_PRESETS = ["30%", "40%", "50%", "60%", "70%"] as const

/** @deprecated Use BACKCOM_PERCENT_PRESETS + fixed/custom modes */
export const BACKCOM_TYPES = [
  "none",
  ...BACKCOM_PERCENT_PRESETS,
  "custom",
  "fixed",
] as const

export type BackcomType = (typeof BACKCOM_TYPES)[number]

export const REBATE_TYPES = [
  "Không có",
  "Theo lot",
  "Theo volume",
  "Theo tháng",
  "Theo tuần",
  "Custom",
] as const

export type RebateType = (typeof REBATE_TYPES)[number]

export const BONUS_TYPES = [
  "Không có",
  "Bonus nạp tiền",
  "Bonus giao dịch",
  "Chịu giá",
  "Hoàn lỗ",
  "Custom",
] as const

export type BonusType = (typeof BONUS_TYPES)[number]

export const PAYOUT_CYCLES = [
  "Hằng ngày",
  "Hằng tuần",
  "Hằng tháng",
  "Theo yêu cầu",
  "Custom",
] as const

export type PayoutCycle = (typeof PAYOUT_CYCLES)[number]

export type BrokerOfferPolicy = {
  backcomType: string | null
  backcomValue: string | null
  rebateType: string | null
  bonusType: string | null
  highlightOffer: string | null
  offerConditions: string | null
  payoutCycle: string | null
}

export function formatBackcomBadge(
  backcomType: string | null | undefined,
  backcomValue: string | null | undefined,
): string | null {
  if (!backcomType || backcomType === "none") return null
  if (backcomType === "fixed") {
    const amount = backcomValue?.trim()
    return amount ? `Backcom ${amount}` : null
  }
  if (backcomType === "custom") {
    const custom = backcomValue?.trim()
    return custom ? `Backcom ${custom}` : null
  }
  return `Backcom ${backcomType}`
}

/** Public global cards: backcom only (no rebate/bonus). */
export function globalBackcomBadge(policy: Partial<BrokerOfferPolicy>): string | null {
  return formatBackcomBadge(policy.backcomType, policy.backcomValue)
}

export function formatRebateBadge(rebateType: string | null | undefined): string | null {
  if (!rebateType || rebateType === "Không có") return null
  if (rebateType === "Custom") return "Hoàn phí"
  return `Hoàn phí ${rebateType.replace(/^Theo /i, "").toLowerCase()}`
}

export function formatBonusBadge(bonusType: string | null | undefined): string | null {
  if (!bonusType || bonusType === "Không có") return null
  if (bonusType === "Custom") return "Bonus / Chịu giá"
  return bonusType
}

export function brokerOfferBadges(policy: Partial<BrokerOfferPolicy>): string[] {
  const badges: string[] = []
  const backcom = formatBackcomBadge(policy.backcomType, policy.backcomValue)
  const rebate = formatRebateBadge(policy.rebateType)
  const bonus = formatBonusBadge(policy.bonusType)
  if (backcom) badges.push(backcom)
  if (rebate) badges.push(rebate)
  if (bonus) badges.push(bonus)
  return badges
}

export function parseOptionalUrl(value: string | null | undefined): {
  ok: true
  value: string | null
} | { ok: false; error: string } {
  const trimmed = value?.trim() || ""
  if (!trimmed) return { ok: true, value: null }
  try {
    const url = new URL(trimmed)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "URL must start with http:// or https://" }
    }
    return { ok: true, value: trimmed }
  } catch {
    return { ok: false, error: "Invalid URL" }
  }
}

export function readOfferPolicyFromFormData(formData: FormData): BrokerOfferPolicy {
  const backcomType = String(formData.get("backcomType") ?? "").trim() || null
  const backcomValueRaw = String(formData.get("backcomValue") ?? "").trim() || null
  const needsValue = backcomType === "custom" || backcomType === "fixed"
  return {
    backcomType,
    backcomValue: needsValue ? backcomValueRaw : null,
    rebateType: String(formData.get("rebateType") ?? "").trim() || null,
    bonusType: String(formData.get("bonusType") ?? "").trim() || null,
    highlightOffer: String(formData.get("highlightOffer") ?? "").trim() || null,
    offerConditions: String(formData.get("offerConditions") ?? "").trim() || null,
    payoutCycle: String(formData.get("payoutCycle") ?? "").trim() || null,
  }
}
