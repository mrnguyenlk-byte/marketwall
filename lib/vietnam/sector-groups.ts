/** Canonical Vietnam heatmap sector groups (FireAnt-style). */

/** FireAnt diagonal order: largest sector top-left → smallest bottom-right. */
export const VN_SECTOR_GROUP_ORDER = [
  "banking",
  "realEstate",
  "industrial",
  "steel",
  "consumer",
  "technology",
  "oilGas",
  "retail",
  "utilities",
  "unclassified",
] as const

export type VnSectorGroupId = (typeof VN_SECTOR_GROUP_ORDER)[number]

/** @deprecated Merged into banking — kept for type compat only. */
export type LegacyVnSectorGroupId =
  | VnSectorGroupId
  | "securities"
  | "insurance"
  | "chemicals"
  | "healthcare"

export const SECTOR_TO_GROUP: Record<string, VnSectorGroupId> = {
  Banking: "banking",
  "Real Estate": "realEstate",
  Brokerage: "banking",
  Securities: "banking",
  Insurance: "banking",
  Steel: "steel",
  Materials: "steel",
  Chemicals: "steel",
  Chemical: "steel",
  Energy: "oilGas",
  "Oil & Gas": "oilGas",
  Retail: "retail",
  Technology: "technology",
  Utilities: "utilities",
  Industrial: "industrial",
  Logistics: "industrial",
  Transport: "industrial",
  Construction: "industrial",
  Textile: "industrial",
  Consumer: "consumer",
  Agriculture: "consumer",
  Healthcare: "consumer",
  "Chưa phân loại": "unclassified",
}

export function normalizeVnSectorGroup(sector: string): VnSectorGroupId {
  const trimmed = sector.trim()
  if (!trimmed || trimmed === "—" || trimmed === "Equity") return "unclassified"
  if (trimmed === "Khác" || trimmed === "KHÁC" || trimmed.toLowerCase() === "other") {
    return "unclassified"
  }
  return SECTOR_TO_GROUP[trimmed] ?? "unclassified"
}

/** i18n keys for sector header labels. */
export const VN_SECTOR_GROUP_LABEL_KEYS: Record<VnSectorGroupId, string> = {
  banking: "sector.banking",
  realEstate: "sector.realEstate",
  industrial: "sector.industrial",
  steel: "sector.steel",
  consumer: "sector.consumer",
  technology: "sector.technology",
  oilGas: "sector.oilGas",
  retail: "sector.retail",
  utilities: "sector.utilities",
  unclassified: "sector.unclassified",
}

/** FireAnt Vietnamese display names (heatmap sector headers). */
export const VN_SECTOR_GROUP_VI_LABELS: Record<VnSectorGroupId, string> = {
  banking: "Tài chính",
  realEstate: "Bất động sản",
  industrial: "Công nghiệp",
  steel: "Vật liệu cơ bản",
  consumer: "Hàng tiêu dùng cơ bản",
  technology: "Công nghệ",
  oilGas: "Năng lượng",
  retail: "Hàng tiêu dùng",
  utilities: "Các dịch vụ hạ tầng",
  unclassified: "Chưa phân loại",
}

export function vnSectorViLabel(id: VnSectorGroupId): string {
  return VN_SECTOR_GROUP_VI_LABELS[id]
}
