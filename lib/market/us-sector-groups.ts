/** Map US heatmap industry labels (seed sector field) to broad Finviz-style sectors. */

const US_SECTOR_BY_INDUSTRY: Record<string, string> = {
  Technology: "Technology",
  Semiconductors: "Technology",
  Communication: "Communication Services",
  Consumer: "Consumer Cyclical",
  Financials: "Financial",
  Healthcare: "Healthcare",
  Energy: "Energy",
  Materials: "Basic Materials",
  Industrials: "Industrials",
  Automotive: "Consumer Cyclical",
}

export function usBroadSector(industry: string): string {
  const key = industry?.trim()
  if (!key) return "Other"
  return US_SECTOR_BY_INDUSTRY[key] ?? key
}
