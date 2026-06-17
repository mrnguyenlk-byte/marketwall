import {
  HOSE_SEEDS,
  HNX_SEEDS,
  UPCOM_SEEDS,
} from "@/lib/vietnam-heatmap-seeds"
import type { MarketAsset } from "@/types/market"

import { normalizeVnSectorGroup, SECTOR_TO_GROUP, type VnSectorGroupId } from "./sector-groups"

/** Canonical sector labels used by {@link SECTOR_TO_GROUP}. */
const BANKING = "Banking"
const REAL_ESTATE = "Real Estate"
const STEEL = "Steel"
const RETAIL = "Retail"
const TECHNOLOGY = "Technology"
const OIL_GAS = "Oil & Gas"
const UTILITIES = "Utilities"
const CONSUMER = "Consumer"
const INDUSTRIAL = "Industrial"

function buildSeedSymbolMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const seed of [...HOSE_SEEDS, ...HNX_SEEDS, ...UPCOM_SEEDS]) {
    map[seed.symbol.toUpperCase()] = seed.sector
  }
  return map
}

/** Seed universe fallback — covers full HOSE/HNX/UPCOM heatmap symbol list. */
const SEED_SYMBOL_TO_SECTOR = buildSeedSymbolMap()

/** Explicit overrides for heatmap grouping when provider data is missing or invalid. */
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
  BAB: BANKING,
  TVB: BANKING,
  SSI: BANKING,
  VND: BANKING,
  VCI: BANKING,
  HCM: BANKING,
  SHS: BANKING,
  MBS: BANKING,
  VIX: BANKING,
  FTS: BANKING,
  BSI: BANKING,
  CTS: BANKING,
  VDS: BANKING,
  ORS: BANKING,
  APS: BANKING,
  BVS: BANKING,
  VIG: BANKING,
  AGR: BANKING,
  VFS: BANKING,
  BVH: BANKING,
  BMI: BANKING,
  MIG: BANKING,
  PVI: BANKING,
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
  BCM: REAL_ESTATE,
  VPI: REAL_ESTATE,
  LDG: REAL_ESTATE,
  SJS: REAL_ESTATE,
  TIG: REAL_ESTATE,
  VPH: REAL_ESTATE,
  SHN: REAL_ESTATE,
  THD: REAL_ESTATE,
  HPG: STEEL,
  HSG: STEEL,
  NKG: STEEL,
  VGS: STEEL,
  SMC: STEEL,
  TLH: STEEL,
  TVN: STEEL,
  GVR: STEEL,
  VCS: STEEL,
  VGC: STEEL,
  NBC: STEEL,
  MWG: RETAIL,
  FRT: RETAIL,
  PNJ: RETAIL,
  DGW: RETAIL,
  PET: RETAIL,
  FPT: TECHNOLOGY,
  CMG: TECHNOLOGY,
  ELC: TECHNOLOGY,
  SAM: TECHNOLOGY,
  VTX: TECHNOLOGY,
  YEG: TECHNOLOGY,
  GAS: OIL_GAS,
  PVD: OIL_GAS,
  PVS: OIL_GAS,
  PVT: OIL_GAS,
  BSR: OIL_GAS,
  OIL: OIL_GAS,
  PLX: OIL_GAS,
  GEG: OIL_GAS,
  PVB: OIL_GAS,
  POW: UTILITIES,
  REE: UTILITIES,
  NT2: UTILITIES,
  BWE: UTILITIES,
  PC1: UTILITIES,
  TV2: UTILITIES,
  MSN: CONSUMER,
  VNM: CONSUMER,
  SAB: CONSUMER,
  SBT: CONSUMER,
  DBC: CONSUMER,
  PAN: CONSUMER,
  QNS: CONSUMER,
  KDC: CONSUMER,
  MCH: CONSUMER,
  ANV: CONSUMER,
  VHC: CONSUMER,
  FMC: CONSUMER,
  DHG: CONSUMER,
  IMP: CONSUMER,
  DBD: CONSUMER,
  TRA: CONSUMER,
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
  MSR: INDUSTRIAL,
  PHR: INDUSTRIAL,
  DCM: INDUSTRIAL,
  AAA: INDUSTRIAL,
  PVC: INDUSTRIAL,
  DDG: INDUSTRIAL,
  VC3: INDUSTRIAL,
  NTP: INDUSTRIAL,
  HUT: INDUSTRIAL,
  VNR: INDUSTRIAL,
  EID: INDUSTRIAL,
  TNG: INDUSTRIAL,
  DGC: STEEL,
  DPM: STEEL,
  LAS: CONSUMER,
  CSV: STEEL,
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

const loggedUnmappedSymbols = new Set<string>()

function isValidProviderSector(sector: string): boolean {
  if (INVALID_PROVIDER_SECTORS.has(sector)) return false
  const group = SECTOR_TO_GROUP[sector]
  return group != null && group !== "unclassified"
}

function logUnmappedSymbol(symbol: string) {
  if (loggedUnmappedSymbols.has(symbol)) return
  loggedUnmappedSymbols.add(symbol)
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
    console.warn(`[vn-sector-map] unmapped symbol: ${symbol}`)
  }
}

/** Resolve VN sector: provider label → explicit map → seed map → unclassified. */
export function resolveVnAssetSector(asset: MarketAsset): VnSectorResolution {
  const provider = asset.sector?.trim() ?? ""

  if (isValidProviderSector(provider)) {
    return { sector: provider, source: "provider" }
  }

  const symbol = asset.symbol.trim().toUpperCase()
  const explicit = VN_SYMBOL_TO_SECTOR[symbol]
  if (explicit) {
    return { sector: explicit, source: "fallback" }
  }

  const seed = SEED_SYMBOL_TO_SECTOR[symbol]
  if (seed) {
    return { sector: seed, source: "fallback" }
  }

  logUnmappedSymbol(symbol)
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
