#!/usr/bin/env node
import puppeteer from "puppeteer-core"

const chromePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
]

const executablePath = chromePaths.find((p) => {
  try {
    return require("node:fs").existsSync(p)
  } catch {
    return false
  }
})

if (!executablePath) {
  console.error("No Chrome/Edge found")
  process.exit(1)
}

const urls = process.argv.slice(2)
if (!urls.length) urls.push("https://btrading.org", "http://127.0.0.1:3000")

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})

for (const url of urls) {
  const page = await browser.newPage()
  const errors = []

  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`)
  })

  console.log(`\n=== ${url} ===`)
  try {
    const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 })
    await page.waitForTimeout(5000)
    const body = await page.evaluate(() => document.body?.innerText ?? "")
    const crashed =
      body.includes("Something went wrong") ||
      body.includes("could not load correctly") ||
      body.includes("application could not load")
    console.log(`status: ${res?.status()}`)
    console.log(`crashed: ${crashed}`)
    console.log(`errors (${errors.length}):`)
    for (const e of errors.slice(0, 25)) console.log(`  ${e}`)
    if (crashed) {
      console.log("body snippet:", body.slice(0, 300).replace(/\s+/g, " "))
    }
  } catch (e) {
    console.log(`navigation failed: ${e.message}`)
  }
  await page.close()
}

await browser.close()
