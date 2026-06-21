import { spawnSync } from "node:child_process"

const candidates = ["python", "python3", "py"]

let ran = false
for (const cmd of candidates) {
  const result = spawnSync(cmd, ["update_xauusd_d1_from_mt5_to_amibroker.py", "--self-test"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  })
  if (result.error?.code === "ENOENT") continue
  ran = true
  if (result.status !== 0) process.exit(result.status ?? 1)
  break
}

if (!ran) {
  console.log("xauusd:d1:verify skipped — Python not installed on this machine")
}
