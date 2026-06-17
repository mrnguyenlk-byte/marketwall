import type { MarketAsset } from "@/types/market"

import { normalizeVnSectorGroup, SECTOR_TO_GROUP, type VnSectorGroupId } from "./sector-groups"

/** Canonical sector labels used by {@link SECTOR_TO_GROUP}. */
const BANKING = "Banking"
const SECURITIES = "Securities"
const REAL_ESTATE = "Real Estate"
const STEEL = "Steel"
const RETAIL = "Retail"
const TECHNOLOGY = "Technology"
const OIL_GAS = "Oil & Gas"
const UTILITIES = "Utilities"
const CONSUMER = "Consumer"
const INDUSTRIAL = "Industrial"
const INSURANCE = "Insurance"
const CHEMICALS = "Chemicals"
const HEALTHCARE = "Healthcare"

/** Explicit symbol → sector map for heatmap grouping when provider data is missing or invalid. */
export const VN_SYMBOL_TO_SECTOR: Record<string, string> = {
  VCB: BANKING,
  BID: BANKING,
  CTG: BANKING,
  TCB: BANKING,
  VPB: BANKING,
  MBB: BANKING,
  ACB: BANKING,
  STB: BANKING,
  SHB: BANKING,
  HDB: BANKING,
  VIB: BANKING,
  TPB: BANKING,
  EIB: BANKING,
  OCB: BANKING,
  LPB: BANKING,
  MSB: BANKING,
  SSB: BANKING,
  NAB: BANKING,
  ABB: BANKING,
  SSI: SECURITIES,
  VND: SECURITIES,
  VCI: SECURITIES,
  HCM: SECURITIES,
  SHS: SECURITIES,
  MBS: SECURITIES,
  VIX: SECURITIES,
  FTS: SECURITIES,
  BSI: SECURITIES,
  CTS: SECURITIES,
  VDS: SECURITIES,
  ORS: SECURITIES,
  APS: SECURITIES,
  BVS: SECURITIES,
  VHM: REAL_ESTATE,
  VIC: REAL_ESTATE,
  VRE: REAL_ESTATE,
  NVL: REAL_ESTATE,
  PDR: REAL_ESTATE,
  DXG: REAL_ESTATE,
  KDH: REAL_ESTATE,
  NLG: REAL_ESTATE,
  DIG: REAL_ESTATE,
  CEO: REAL_ESTATE,
  KBC: REAL_ESTATE,
  IDC: REAL_ESTATE,
  SZC: REAL_ESTATE,
  HDG: REAL_ESTATE,
  AGG: REAL_ESTATE,
  SCR: REAL_ESTATE,
  HQC: REAL_ESTATE,
  ITA: REAL_ESTATE,
  IJC: REAL_ESTATE,
  TCH: REAL_ESTATE,
  HPG: STEEL,
  HSG: STEEL,
  NKG: STEEL,
  VGS: STEEL,
  SMC: STEEL,
  TLH: STEEL,
  MWG: RETAIL,
  FRT: RETAIL,
  PNJ: RETAIL,
  DGW: RETAIL,
  PET: RETAIL,
  FPT: TECHNOLOGY,
  CMG: TECHNOLOGY,
  ELC: TECHNOLOGY,
  SAM: TECHNOLOGY,
  GAS: OIL_GAS,
  PVD: OIL_GAS,
  PVS: OIL_GAS,
  PVT: OIL_GAS,
  BSR: OIL_GAS,
  OIL: OIL_GAS,
  PLX: OIL_GAS,
  POW: UTILITIES,
  REE: UTILITIES,
  NT2: UTILITIES,
  GEG: UTILITIES,
  PC1: UTILITIES,
  BWE: UTILITIES,
  MSN: CONSUMER,
  VNM: CONSUMER,
  SAB: CONSUMER,
  SBT: CONSUMER,
  DBC: CONSUMER,
  PAN: CONSUMER,
  QNS: CONSUMER,
  KDC: CONSUMER,
  MCH: CONSUMER,
  GMD: INDUSTRIAL,
  VSC: INDUSTRIAL,
  HAH: INDUSTRIAL,
  VJC: INDUSTRIAL,
  HVN: INDUSTRIAL,
  ACV: INDUSTRIAL,
  GEX: INDUSTRIAL,
  VCG: INDUSTRIAL,
  HHV: INDUSTRIAL,
  CII: INDUSTRIAL,
  LCG: INDUSTRIAL,
  FCN: INDUSTRIAL,
  CTD: INDUSTRIAL,
  HBC: INDUSTRIAL,
  BVH: INSURANCE,
  BMI: INSURANCE,
  MIG: INSURANCE,
  PVI: INSURANCE,
  DGC: CHEMICALS,
  DCM: CHEMICALS,
  DPM: CHEMICALS,
  LAS: CHEMICALS,
  CSV: CHEMICALS,
  DHG: HEALTHCARE,
  IMP: HEALTHCARE,
  DBD: HEALTHCARE,
  TRA: HEALTHCARE,
}

export const VN_UNMAPPED_SECTOR_LABEL = "Chưa phân loại"

export type VnSectorResolveSource = "provider" | "fallback" | "unmapped"

export type VnSectorResolution = {
  sector: string
  source: VnSectorResolveSource
}

const INVALID_PROVIDER_SECTORS = new Set([
  "",
  "—",
  "Equity",
  "Khác",
  "KHÁC",
  "Other",
  "other",
  "UNKNOWN",
  "Unknown",
  "unknown",
])

function isValidProviderSector(sector: string): boolean {
  if (INVALID_PROVIDER_SECTORS.has(sector)) return false
  const group = SECTOR_TO_GROUP[sector]
  return group != null && group !== "unclassified"
}

/** Resolve VN sector: provider label → symbol map → unclassified. */
export function resolveVnAssetSector(asset: MarketAsset): VnSectorResolution {
  const provider = asset.sector?.trim() ?? ""

  if (isValidProviderSector(provider)) {
    return { sector: provider, source: "provider" }
  }

  const symbol = asset.symbol.trim().toUpperCase()
  const fallback = VN_SYMBOL_TO_SECTOR[symbol]
  if (fallback) {
    return { sector: fallback, source: "fallback" }
  }

  return { sector: VN_UNMAPPED_SECTOR_LABEL, source: "unmapped" }
}

export function vnSectorGroupForAsset(asset: MarketAsset): VnSectorGroupId {
  const { sector } = resolveVnAssetSector(asset)
  return normalizeVnSectorGroup(sector)
}

export function countVnSectorSources(assets: MarketAsset[]): {
  provider: number
  fallback: number
  unmapped: number
  unmappedSymbols: string[]
} {
  let provider = 0
  let fallback = 0
  let unmapped = 0
  const unmappedSymbols: string[] = []

  for (const asset of assets) {
    const resolution = resolveVnAssetSector(asset)
    if (resolution.source === "provider") provider++
    else if (resolution.source === "fallback") fallback++
    else {
      unmapped++
      unmappedSymbols.push(asset.symbol)
    }
  }

  return { provider, fallback, unmapped, unmappedSymbols }
}
