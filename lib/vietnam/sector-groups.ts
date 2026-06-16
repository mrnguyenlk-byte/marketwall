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
  "other",
] as const

export type VnSectorGroupId = (typeof VN_SECTOR_GROUP_ORDER)[number]

const SECTOR_TO_GROUP: Record<string, VnSectorGroupId> = {
  Banking: "banking",
  "Real Estate": "realEstate",
  Brokerage: "securities",
  Securities: "securities",
  Steel: "steel",
  Energy: "oilGas",
  "Oil & Gas": "oilGas",
  Retail: "retail",
  Technology: "technology",
  Utilities: "utilities",
  Industrial: "industrial",
}

export function normalizeVnSectorGroup(sector: string): VnSectorGroupId {
  const trimmed = sector.trim()
  if (!trimmed || trimmed === "—" || trimmed === "Equity") return "other"
  return SECTOR_TO_GROUP[trimmed] ?? "other"
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
  other: "sector.other",
}
