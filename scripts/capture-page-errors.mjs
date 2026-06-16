#!/usr/bin/env node
import { chromium } from "playwright"

const urls = process.argv.slice(2)
if (!urls.length) urls.push("https://btrading.org", "http://127.0.0.1:3000")

for (const url of urls) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []

  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`)
  })

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 })
    await page.waitForTimeout(4000)
    const body = await page.textContent("body")
    const crashed =
      body?.includes("Something went wrong") ||
      body?.includes("could not load correctly") ||
      false

    console.log(`\n=== ${url} ===`)
    console.log(`crashed: ${crashed}`)
    console.log(`errors (${errors.length}):`)
    for (const err of errors.slice(0, 20)) console.log(`  ${err}`)
  } catch (e) {
    console.log(`\n=== ${url} ===`)
    console.log(`navigation failed: ${e.message}`)
  }

  await browser.close()
}
