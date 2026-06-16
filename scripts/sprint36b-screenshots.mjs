import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.BASE_URL ?? "http://localhost:3015"
const OUT = path.join(process.cwd(), "docs", "sprint36b")
const WIDTHS = [1440, 1920, 2560]

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage()

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: Math.round(width * 0.65) })
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 120_000 })
    await page.waitForSelector('[data-grouping="sector-treemap"]', { timeout: 60_000 })
    await page.waitForTimeout(1500)
    const outPath = path.join(OUT, `after-${width}.png`)
    await page.screenshot({ path: outPath, fullPage: false })
    console.log("saved", outPath)
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
