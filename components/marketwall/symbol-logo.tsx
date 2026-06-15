import { cn } from "@/lib/utils"

export type SymbolLogoMeta = {
  abbr: string
  bg: string
  fg?: string
}

const SYMBOL_LOGOS: Record<string, SymbolLogoMeta> = {
  "VN-INDEX": { abbr: "VN", bg: "#c41e3a", fg: "#ffffff" },
  VN30: { abbr: "V30", bg: "#c41e3a", fg: "#ffffff" },
  VN10: { abbr: "V10", bg: "#c41e3a", fg: "#ffffff" },
  "HNX-INDEX": { abbr: "HNX", bg: "#1e4d8c", fg: "#ffffff" },
  "UPCOM-INDEX": { abbr: "UP", bg: "#2d6a4f", fg: "#ffffff" },
  VNINDEX: { abbr: "VN", bg: "#c41e3a", fg: "#ffffff" },
  HNX: { abbr: "HNX", bg: "#1e4d8c", fg: "#ffffff" },
  UPCOM: { abbr: "UP", bg: "#2d6a4f", fg: "#ffffff" },
  "S&P 500": { abbr: "SPX", bg: "#1d4ed8", fg: "#ffffff" },
  SP500: { abbr: "SPX", bg: "#1d4ed8", fg: "#ffffff" },
  NASDAQ: { abbr: "NDQ", bg: "#7c3aed", fg: "#ffffff" },
  "DOW JONES": { abbr: "DJI", bg: "#0f766e", fg: "#ffffff" },
  "FTSE 100": { abbr: "UKX", bg: "#1e3a5f", fg: "#ffffff" },
  "NIKKEI 225": { abbr: "NKY", bg: "#be123c", fg: "#ffffff" },
  "HANG SENG": { abbr: "HSI", bg: "#b45309", fg: "#ffffff" },
  SHANGHAI: { abbr: "SH", bg: "#dc2626", fg: "#ffffff" },
  KOSPI: { abbr: "KOS", bg: "#2563eb", fg: "#ffffff" },
  DAX: { abbr: "DAX", bg: "#f59e0b", fg: "#111827" },
  GOLD: { abbr: "AU", bg: "#ca8a04", fg: "#111827" },
  "WTI OIL": { abbr: "WTI", bg: "#374151", fg: "#f9fafb" },
  SILVER: { abbr: "AG", bg: "#9ca3af", fg: "#111827" },
  BRENT: { abbr: "BRN", bg: "#4b5563", fg: "#f9fafb" },
  COPPER: { abbr: "CU", bg: "#b45309", fg: "#ffffff" },
  "BTC/USD": { abbr: "BTC", bg: "#f7931a", fg: "#111827" },
  BTC: { abbr: "BTC", bg: "#f7931a", fg: "#111827" },
  BTCUSD: { abbr: "BTC", bg: "#f7931a", fg: "#111827" },
  "ETH/USD": { abbr: "ETH", bg: "#627eea", fg: "#ffffff" },
  ETH: { abbr: "ETH", bg: "#627eea", fg: "#ffffff" },
  "BNB/USD": { abbr: "BNB", bg: "#f0b90b", fg: "#111827" },
  "SOL/USD": { abbr: "SOL", bg: "#14f195", fg: "#111827" },
  "EUR/USD": { abbr: "EUR", bg: "#003399", fg: "#ffcc00" },
  "GBP/USD": { abbr: "GBP", bg: "#012169", fg: "#ffffff" },
  "USD/JPY": { abbr: "JPY", bg: "#bc002d", fg: "#ffffff" },
  "USD/VND": { abbr: "VND", bg: "#c41e3a", fg: "#ffde00" },
  DXY: { abbr: "DXY", bg: "#166534", fg: "#ffffff" },
}

function fallbackLogo(symbol: string): SymbolLogoMeta {
  const clean = symbol.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
  const abbr = clean.slice(0, 3) || symbol.slice(0, 2).toUpperCase()
  return { abbr, bg: "#334155", fg: "#f8fafc" }
}

export function getSymbolLogo(symbol: string): SymbolLogoMeta {
  return SYMBOL_LOGOS[symbol] ?? fallbackLogo(symbol)
}

type SymbolLogoProps = {
  symbol: string
  size?: "xs" | "sm" | "md"
  className?: string
}

const SIZE_CLASS = {
  xs: "size-4 text-[7px] rounded-[3px]",
  sm: "size-[18px] text-[8px] rounded-[4px]",
  md: "size-5 text-[9px] rounded-[5px]",
} as const

export function SymbolLogo({ symbol, size = "sm", className }: SymbolLogoProps) {
  const logo = getSymbolLogo(symbol)

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-bold leading-none tracking-tight",
        SIZE_CLASS[size],
        className,
      )}
      style={{ backgroundColor: logo.bg, color: logo.fg ?? "#ffffff" }}
      aria-hidden
      title={symbol}
    >
      {logo.abbr}
    </span>
  )
}
