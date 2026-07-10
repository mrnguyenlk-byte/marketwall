import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { EconomicEventRecord } from "@/lib/providers/types"
import {
  compareActualToForecast,
  containsForbiddenUsMacroTerms,
  deduplicateUsMacroEvents,
  filterUsMacroCandidates,
  getUsMacroEventPriority,
  mapRecordToUsEvent,
  selectTopUsMacroEvents,
  usMacroEventDedupKey,
} from "./us-macro-core"

function makeRecord(
  overrides: Partial<EconomicEventRecord> & Pick<EconomicEventRecord, "id" | "event">,
): EconomicEventRecord {
  return {
    time: "08:30",
    country: "US",
    currency: "USD",
    impact: "high",
    previous: "1.0%",
    forecast: "1.1%",
    actual: "1.2%",
    source: "test",
    publishedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("compareActualToForecast", () => {
  it("detects higher actual", () => {
    assert.equal(compareActualToForecast("2.6%", "2.5%"), "higher")
  })

  it("detects lower actual", () => {
    assert.equal(compareActualToForecast("145K", "180K"), "lower")
  })

  it("detects in-line actual within tolerance", () => {
    assert.equal(compareActualToForecast("2.50%", "2.50%"), "in_line")
  })

  it("returns unknown when forecast is missing", () => {
    assert.equal(compareActualToForecast("145K", null), "unknown")
  })
})

describe("priority and selection", () => {
  it("prioritizes FOMC over CPI and NFP", () => {
    const fomc = getUsMacroEventPriority("FOMC Rate Decision")
    const cpi = getUsMacroEventPriority("US CPI")
    const nfp = getUsMacroEventPriority("Nonfarm Payrolls")
    assert.ok(fomc > cpi)
    assert.ok(fomc > nfp)
    assert.ok(nfp > cpi)
  })

  it("selects at most 3 events by priority", () => {
    const now = Date.now()
    const records = [
      makeRecord({
        id: "jobless",
        event: "Initial Jobless Claims",
        actual: "220K",
        publishedAt: new Date(now).toISOString(),
      }),
      makeRecord({
        id: "cpi",
        event: "US CPI",
        actual: "2.4%",
        forecast: "2.5%",
        publishedAt: new Date(now - 1_000).toISOString(),
      }),
      makeRecord({
        id: "nfp",
        event: "Nonfarm Payrolls",
        actual: "145K",
        forecast: "180K",
        publishedAt: new Date(now - 2_000).toISOString(),
      }),
      makeRecord({
        id: "fomc",
        event: "FOMC Rate Decision",
        actual: "4.25-4.50%",
        forecast: "4.25-4.50%",
        publishedAt: new Date(now - 3_000).toISOString(),
      }),
    ]

    const selected = selectTopUsMacroEvents(filterUsMacroCandidates(records, now - 86_400_000))
    assert.equal(selected.length, 3)
    assert.equal(selected[0]?.event, "FOMC Rate Decision")
    assert.ok(selected.some((event) => event.event === "Nonfarm Payrolls"))
    assert.ok(selected.some((event) => event.event === "US CPI"))
    assert.equal(selected.some((event) => event.event === "Initial Jobless Claims"), false)
  })
})

describe("deduplicate against previous bulletin", () => {
  it("removes events already covered by previous article keys", () => {
    const event = mapRecordToUsEvent(
      makeRecord({ id: "cpi-1", event: "US CPI", actual: "2.4%", forecast: "2.5%" }),
    )
    const exclude = new Set([usMacroEventDedupKey(event)])
    const { events, removedKeys } = deduplicateUsMacroEvents([event], exclude)
    assert.equal(events.length, 0)
    assert.equal(removedKeys.length, 1)
  })

  it("falls back to event name + publishedAt when id is absent", () => {
    const event = mapRecordToUsEvent(
      makeRecord({ id: "", event: "US CPI", actual: "2.4%", forecast: "2.5%" }),
    )
  const key = usMacroEventDedupKey({ ...event, id: "" })
    assert.match(key, /^name:us cpi\|at:/)
  })
})

describe("filterUsMacroCandidates", () => {
  it("keeps only high-impact US released events", () => {
    const now = Date.now()
    const records = [
      makeRecord({ id: "us", event: "US CPI", actual: "2.4%", impact: "high" }),
      makeRecord({
        id: "vn",
        event: "Vietnam CPI",
        country: "VN",
        actual: "3.0%",
        impact: "high",
      }),
      makeRecord({
        id: "pending",
        event: "US Retail Sales",
        actual: "—",
        impact: "high",
      }),
      makeRecord({
        id: "medium",
        event: "US Retail Sales",
        actual: "0.5%",
        impact: "medium",
      }),
    ]

    const filtered = filterUsMacroCandidates(records, now - 86_400_000)
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0]?.event, "US CPI")
  })
})

describe("forbidden market-direction terms", () => {
  it("flags banned phrases", () => {
    assert.equal(containsForbiddenUsMacroTerms("Hỗ trợ vàng trong ngắn hạn"), true)
    assert.equal(containsForbiddenUsMacroTerms("Cho thấy áp lực lạm phát đang giảm."), false)
  })
})
