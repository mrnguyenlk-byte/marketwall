#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const dir = process.argv[2]
if (!dir) {
  console.error("Usage: node scripts/grep-chunks.mjs <dir> <pattern>")
  process.exit(1)
}
const pattern = process.argv[3] ?? "provider"

for (const file of readdirSync(dir).filter((f) => f.endsWith(".js"))) {
  const content = readFileSync(join(dir, file), "utf8")
  if (content.includes(pattern)) {
    const idx = content.indexOf(pattern)
    console.log(`${file}: ...${content.slice(Math.max(0, idx - 60), idx + 80)}...`)
  }
}
