/** Canonical Vietnam heatmap sector groups (Sprint 15). */

export const VN_SECTOR_GROUP_ORDER = [
  "banking",
  "realEstate",
  "securities",
  "steel",
  "oilGas",
  "retail",
  "technology",
  "utilities",
  "industrial",
  "consumer",
  "insurance",
  "chemicals",
  "healthcare",
  "unclassified",
] as const

export type VnSectorGroupId = (typeof VN_SECTOR_GROUP_ORDER)[number]

export const SECTOR_TO_GROUP: Record<string, VnSectorGroupId> = {
  Banking: "banking",
  "Real Estate": "realEstate",
  Brokerage: "securities",
  Securities: "securities",
  Steel: "steel",
  Materials: "steel",
  Energy: "oilGas",
  "Oil & Gas": "oilGas",
  Retail: "retail",
  Technology: "technology",
  Utilities: "utilities",
  Industrial: "industrial",
  Logistics: "industrial",
  Transport: "industrial",
  Consumer: "consumer",
  Insurance: "insurance",
  Chemicals: "chemicals",
  Chemical: "chemicals",
  Healthcare: "healthcare",
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

export const VN_SECTOR_GROUP_LABEL_KEYS: Record<VnSectorGroupId, string> = {
  banking: "sector.banking",
  realEstate: "sector.realEstate",
  securities: "sector.securities",
  steel: "sector.steel",
  oilGas: "sector.oilGas",
  retail: "sector.retail",
  technology: "sector.technology",
  utilities: "sector.utilities",
  industrial: "sector.industrial",
  consumer: "sector.consumer",
  insurance: "sector.insurance",
  chemicals: "sector.chemicals",
  healthcare: "sector.healthcare",
  unclassified: "sector.unclassified",
}
