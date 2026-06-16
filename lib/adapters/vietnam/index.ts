import "server-only"

export type {
  AdapterFetchResult,
  AdapterFetchStatus,
  FireantRawIndex,
  FireantRawStock,
  NormalizedVietnamIndex,
  NormalizedVietnamMarket,
  NormalizedVietnamStock,
  TcbsRawIndex,
  TcbsRawStock,
  VietstockRawIndex,
  VietstockRawStock,
  VietnamAdapterCapability,
  VietnamAdapterId,
  VietnamAdapterMeta,
  VietnamExchangeId,
  VietnamExchangeLabel,
  VietnamMarketAdapter,
} from "./types"

export {
  DASHBOARD_INDEX_ALIASES,
  PROVIDER_INDEX_ALIASES,
  exchangeLabelToId,
  groupStocksByExchange,
  normalizeExchangeLabel,
  normalizeFireantIndex,
  normalizeFireantStock,
  normalizeIndexSymbol,
  normalizeStockSymbol,
  normalizeTcbsIndex,
  normalizeTcbsStock,
  normalizeVietstockIndex,
  normalizeVietstockStock,
  normalizedStocksToHeatmapBuckets,
  normalizedToProviderIndices,
  toDashboardIndexSymbol,
} from "./normalize"

export {
  FIREANT_ADAPTER_META,
  fireantAdapter,
  isFireantConfigured,
  mapFireantSnapshot,
} from "./fireant-adapter"

export {
  VIETSTOCK_ADAPTER_META,
  isVietstockConfigured,
  mapVietstockSnapshot,
  vietstockAdapter,
} from "./vietstock-adapter"

export {
  TCBS_ADAPTER_META,
  isTcbsConfigured,
  mapTcbsSnapshot,
  tcbsAdapter,
} from "./tcbs-adapter"

export {
  VPS_ADAPTER_META,
  isVpsConfigured,
  vpsAdapter,
} from "./vps-adapter"

export {
  VIETNAM_ADAPTER_PRIORITY,
  VIETNAM_ADAPTERS,
  fetchVietnamMarketFromAdapters,
  getVietnamAdapter,
  listVietnamAdapters,
} from "./registry"
