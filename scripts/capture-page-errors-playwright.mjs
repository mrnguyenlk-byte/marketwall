#!/usr/bin/env node
import { chromium } from "playwright"

const url = process.argv[2] ?? "https://btrading.org"
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []

page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`)
})

await page.goto(url, { waitUntil: "networkidle", timeout: 90000 })
await page.waitForTimeout(5000)
const body = await page.textContent("body")
const crashed =
  body?.includes("Something went wrong") ||
  body?.includes("could not load correctly") ||
  false

console.log(`url: ${url}`)
console.log(`crashed: ${crashed}`)
console.log(`errors (${errors.length}):`)
for (const e of errors.slice(0, 20)) console.log(`  ${e}`)

await browser.close()
