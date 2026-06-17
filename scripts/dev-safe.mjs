#!/usr/bin/env node
/**
 * Start Next dev on 127.0.0.1:3000. If port 3000 is in use, kill that listener first.
 */
import { execSync, spawn } from "node:child_process"
import { platform } from "node:os"

const HOST = "127.0.0.1"
const PORT = 3000

function pidsOnPort(port) {
  const pids = new Set()

  if (platform() === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue
        const pid = line.trim().split(/\s+/).pop()
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid)
      }
    } catch {
      /* port free */
    }
    return [...pids]
  }

  try {
    const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function killPids(pids) {
  for (const pid of pids) {
    try {
      if (platform() === "win32") {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" })
      } else {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" })
      }
      console.log(`[dev-safe] Freed port ${PORT} (pid ${pid})`)
    } catch {
      console.warn(`[dev-safe] Could not kill pid ${pid}`)
    }
  }
}

const busy = pidsOnPort(PORT)
if (busy.length) {
  console.log(`[dev-safe] Port ${PORT} in use — stopping ${busy.join(", ")}`)
  killPids(busy)
}

console.log(`[dev-safe] Starting next dev at http://${HOST}:${PORT}`)

const child = spawn(
  "npx",
  ["next", "dev", "--hostname", HOST, "--port", String(PORT)],
  { stdio: "inherit", shell: true },
)

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0))
})

process.on("SIGINT", () => child.kill("SIGINT"))
process.on("SIGTERM", () => child.kill("SIGTERM"))
