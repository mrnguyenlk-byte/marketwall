#!/usr/bin/env node
/**
 * Manual CafeF proprietary EOD sync.
 * Requires DATABASE_URL and running migration.
 *
 * Usage:
 *   node scripts/sync-proprietary-eod.mjs
 *   node scripts/sync-proprietary-eod.mjs --force
 *
 * Or POST to deployed API:
 *   curl -X POST "https://btrading.org/api/sync/proprietary-eod?force=1" \
 *     -H "Authorization: Bearer $SYNC_SECRET"
 */

const force = process.argv.includes("--force")
const base = process.env.SYNC_BASE_URL ?? "http://127.0.0.1:3000"
const secret = process.env.SYNC_SECRET

const url = `${base}/api/sync/proprietary-eod${force ? "?force=1" : ""}`
const headers = { "Content-Type": "application/json" }
if (secret) headers.Authorization = `Bearer ${secret}`

const res = await fetch(url, { method: "POST", headers })
const body = await res.json()
console.log(JSON.stringify(body, null, 2))
process.exit(res.ok ? 0 : 1)
