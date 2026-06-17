const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
  Accept: "application/json, text/plain, */*",
  Referer: "https://cafef.vn/du-lieu/Lich-su-giao-dich-gh3-4.chn",
  "X-Requested-With": "XMLHttpRequest",
}

async function tryUrl(label, url, init = {}) {
  const res = await fetch(url, { headers, ...init })
  const text = await res.text()
  const ok = !text.includes("symbol is null or empty") && text.length > 80
  console.log(label, res.status, ok ? "OK" : "FAIL", text.slice(0, 300))
  return ok ? text : null
}

const page = await fetch("https://cafef.vn/du-lieu/Lich-su-giao-dich-gh3-4.chn", { headers })
const html = await page.text()
const ashx = [...new Set([...html.matchAll(/Ajax\/[A-Za-z0-9_/]+\.ashx/g)].map((m) => m[0]))]
console.log("ashx on page:", ashx)

for (const path of ashx.filter((p) => /tu|Tu|GH3|gh3/i.test(p))) {
  await tryUrl(path, `https://s.cafef.vn/${path}?PageIndex=1&PageSize=5&Symbol=VCB`)
}

const bodies = [
  "Symbol=VCB&PageIndex=1&PageSize=10",
  "symbol=VCB&PageIndex=1&PageSize=10",
  "Symbol=VCB&StartDate=01/06/2026&EndDate=16/06/2026",
]
for (const body of bodies) {
  await tryUrl(`POST ${body}`, "https://s.cafef.vn/Ajax/PageNew/DataHistory/GDTuDoanh.ashx", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
}

// FireAnt probes
for (const u of [
  "https://restv2.fireant.vn/symbols/VCB/proprietary-trading",
  "https://restv2.fireant.vn/proprietary-trading/VCB",
  "https://restv2.fireant.vn/symbols/VCB/proprietary",
]) {
  try {
    const r = await fetch(u, { headers: { Accept: "application/json" } })
    console.log("fireant", u, r.status, (await r.text()).slice(0, 200))
  } catch (e) {
    console.log("fireant err", e.message)
  }
}

const page2 = await fetch("https://cafef.vn/du-lieu/Lich-su-giao-dich-gh3-4.chn", { headers })
const html2 = await page2.text()
const domainMatch = html2.match(/domain\s*=\s*['"]([^'"]+)['"]/)
console.log("domain var:", domainMatch?.[1])

const dateFormats = [
  ["06/01/2026", "06/16/2026"],
  ["01/06/2026", "16/06/2026"],
  ["16-06-2026", "16-06-2026"],
]
for (const [start, end] of dateFormats) {
  for (const exchange of ["HOSE", "HSX", ""]) {
    const q = new URLSearchParams({
      Symbol: "VCB",
      Exchange: exchange || "HOSE",
      StartDate: start,
      EndDate: end,
      PageIndex: "1",
      PageSize: "5",
    })
    if (!exchange) q.delete("Exchange")
    const u = `https://s.cafef.vn/Ajax/PageNew/DataHistory/GDTuDoanh.ashx?${q}`
    const r = await fetch(u, { headers })
    const j = await r.json()
    if (j.Data) {
      console.log("WORKING", q.toString(), JSON.stringify(j.Data).slice(0, 400))
    }
  }
}

// GDKhoiNgoai with dates for comparison
const foreignUrl =
  "https://s.cafef.vn/Ajax/PageNew/DataHistory/GDKhoiNgoai.ashx?Symbol=VCB&Exchange=HOSE&StartDate=06/01/2026&EndDate=06/16/2026&PageIndex=1&PageSize=3"
const fr = await fetch(foreignUrl, { headers })
const fj = await fr.json()
console.log(
  "GDKhoiNgoai dated",
  fj.Success,
  fj.Message,
  fj.Data?.Data?.[0] ? Object.keys(fj.Data.Data[0]) : null,
)
