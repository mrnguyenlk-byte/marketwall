/**
 * Sprint 36 sector tile count — run after build:
 * node scripts/sprint36-sector-count.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3016"

async function main() {
  const res = await fetch(`${BASE}/api/heatmaps/vn`)
  const data = await res.json()
  const items = data.items ?? []
  console.log(JSON.stringify({ apiCount: items.length, source: data.source }, null, 2))

  // Sector buckets via same label keys as sector-groups
  const SECTOR_MAP = {
    banking: ["bank", "ngân hàng", "banking"],
    securities: ["chứng khoán", "securities", "broker"],
    realEstate: ["bất động sản", "real estate", "reit"],
    steel: ["thép", "steel"],
    oilGas: ["dầu khí", "oil", "gas", "energy"],
    retail: ["bán lẻ", "retail", "consumer"],
    technology: ["công nghệ", "technology", "tech", "software"],
    industrial: ["kcn", "industrial", "công nghiệp"],
    utilities: ["tiện ích", "utilities", "power"],
    other: [],
  }

  function normalize(sector) {
    const s = (sector ?? "").toLowerCase()
    for (const [id, keys] of Object.entries(SECTOR_MAP)) {
      if (id === "other") continue
      if (keys.some((k) => s.includes(k))) return id
    }
    return "other"
  }

  const buckets = Object.fromEntries(Object.keys(SECTOR_MAP).map((k) => [k, 0]))
  for (const row of items) {
    buckets[normalize(row.sector)] = (buckets[normalize(row.sector)] ?? 0) + 1
  }
  console.log("Input stocks per sector (API, max 200):", buckets)
  console.log("Total:", items.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
