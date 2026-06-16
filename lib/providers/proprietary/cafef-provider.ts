import "server-only"

import { fetchWithTimeout } from "@/lib/providers/fetch-utils"

/** CafeF GH3 — post-market proprietary trading (EOD only). */
export const CAFEF_PROPRIETARY_URL =
  "https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/GDTuDoanh.ashx"

export type CafeFExchange = "HOSE" | "HNX" | "UPCOM" | "VN30" | "HNX30"

export type NormalizedProprietaryRow = {
  date: string
  symbol: string
  buyValue: number
  sellValue: number
  netValue: number
  buyVolume: number
  sellVolume: number
  source: "cafef"
}

export type CafeFProprietaryFetchParams = {
  symbol?: string
  exchange?: CafeFExchange
  startDate: string
  endDate: string
  pageIndex?: number
  pageSize?: number
}

type CafeFRow = {
  Symbol?: string
  Date?: string
  KLcpMua?: number
  KlcpBan?: number
  GtMua?: number
  GtBan?: number
}

type CafeFResponse = {
  Success?: boolean
  Message?: string
  Data?: {
    TotalCount?: number
    DateIndex?: string
    TradingReport?: {
      TongGtMua?: number
      TongGtBan?: number
      TongKlMua?: number
      TongKlBan?: number
    }
    Data?: CafeFRow[] | { ListDataTudoanh?: CafeFRow[] }
  }
}

function cafefHeaders(): HeadersInit {
  return {
    Accept: "application/json, text/plain, */*",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://cafef.vn/du-lieu/Lich-su-giao-dich-gh3-4.chn",
    "X-Requested-With": "XMLHttpRequest",
  }
}

/** CafeF uses MM/DD/YYYY in query strings. */
export function formatCafefUsDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

/** Parse CafeF DD/MM/YYYY → ISO YYYY-MM-DD. */
export function parseCafefVnDate(value: string): string {
  const parts = value.trim().split("/")
  if (parts.length !== 3) return value
  const [dd, mm, yyyy] = parts
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`
}

function extractRows(data: CafeFResponse["Data"]): CafeFRow[] {
  if (!data?.Data) return []
  if (Array.isArray(data.Data)) return data.Data
  return data.Data.ListDataTudoanh ?? []
}

export function normalizeCafefProprietaryRow(row: CafeFRow): NormalizedProprietaryRow | null {
  const symbol = row.Symbol?.trim().toUpperCase()
  const dateRaw = row.Date?.trim()
  if (!symbol || !dateRaw) return null

  const buyValue = Number(row.GtMua ?? 0)
  const sellValue = Number(row.GtBan ?? 0)
  const buyVolume = Number(row.KLcpMua ?? 0)
  const sellVolume = Number(row.KlcpBan ?? 0)

  if (buyValue === 0 && sellValue === 0 && buyVolume === 0 && sellVolume === 0) {
    return null
  }

  return {
    date: parseCafefVnDate(dateRaw),
    symbol,
    buyValue,
    sellValue,
    netValue: buyValue - sellValue,
    buyVolume,
    sellVolume,
    source: "cafef",
  }
}

export async function fetchCafefProprietaryPage(
  params: CafeFProprietaryFetchParams,
): Promise<{
  rows: NormalizedProprietaryRow[]
  totalCount: number
  tradingReport: CafeFResponse["Data"] extends infer D ? D extends { TradingReport?: infer T } ? T : null : null
}> {
  const symbol = params.symbol ?? "ALL"
  const exchange = params.exchange ?? "HOSE"
  const pageIndex = params.pageIndex ?? 1
  const pageSize = params.pageSize ?? 100

  const query = new URLSearchParams({
    Symbol: symbol,
    Exchange: exchange,
    StartDate: params.startDate,
    EndDate: params.endDate,
    PageIndex: String(pageIndex),
    PageSize: String(pageSize),
  })

  const res = await fetchWithTimeout(
    `${CAFEF_PROPRIETARY_URL}?${query}`,
    { headers: cafefHeaders(), cache: "no-store" },
    20_000,
  )

  if (!res.ok) {
    throw new Error(`CafeF proprietary HTTP ${res.status}`)
  }

  const json = (await res.json()) as CafeFResponse
  if (!json.Data) {
    throw new Error(json.Message ?? "CafeF proprietary returned no data")
  }

  const rows = extractRows(json.Data)
    .map(normalizeCafefProprietaryRow)
    .filter((row): row is NormalizedProprietaryRow => row != null)

  return {
    rows,
    totalCount: json.Data.TotalCount ?? rows.length,
    tradingReport: json.Data.TradingReport ?? null,
  }
}

/** Paginate CafeF ALL-symbol proprietary rows for an exchange and date window. */
export async function fetchCafefProprietaryAll(
  exchange: CafeFExchange,
  startDate: string,
  endDate: string,
  pageSize = 100,
): Promise<NormalizedProprietaryRow[]> {
  const all: NormalizedProprietaryRow[] = []
  let pageIndex = 1
  let totalCount = Infinity

  while (all.length < totalCount) {
    const page = await fetchCafefProprietaryPage({
      symbol: "ALL",
      exchange,
      startDate,
      endDate,
      pageIndex,
      pageSize,
    })
    totalCount = page.totalCount
    all.push(...page.rows)
    if (page.rows.length === 0) break
    pageIndex++
    if (pageIndex > 50) break
  }

  return all
}
