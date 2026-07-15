import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { EconomicEventRecord } from "@/lib/providers/types"
import {
  compareActualToForecast,
  containsForbiddenUsMacroTerms,
  deduplicateUsMacroEvents,
  filterUsMacroCandidates,
  getUsMacroEventPriority,
  isMissingMacroValue,
  mapRecordToUsEvent,
  normalizeImpactLevel,
  normalizeUsCountry,
  normalizeUsMacroEventName,
  resolveUsMacroSinceMs,
  selectTopUsMacroEvents,
  toNullableMacroValue,
  usMacroEventDedupKey,
  vietnamWallTimeToUtcMs,
} from "./us-macro-core"
import { buildUsMacroSummary } from "./us-macro-summary"

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

  it("handles negative CPI MoM prints", () => {
    assert.equal(compareActualToForecast("-0.4%", "-0.1%"), "lower")
  })
})

describe("actual nullish checks", () => {
  it("preserves zero and negative values", () => {
    assert.equal(isMissingMacroValue("-0.4%"), false)
    assert.equal(isMissingMacroValue("0%"), false)
    assert.equal(isMissingMacroValue(0), false)
    assert.equal(isMissingMacroValue(-0.4), false)
    assert.equal(toNullableMacroValue("-0.4%"), "-0.4%")
    assert.equal(toNullableMacroValue(0), "0")
  })

  it("treats placeholders and empty as missing", () => {
    assert.equal(isMissingMacroValue(null), true)
    assert.equal(isMissingMacroValue(undefined), true)
    assert.equal(isMissingMacroValue(""), true)
    assert.equal(isMissingMacroValue("—"), true)
    assert.equal(isMissingMacroValue("-"), true)
  })
})

describe("impact and country normalization", () => {
  it("maps impact aliases to high", () => {
    for (const value of ["high", "High Impact", "red", "3", "3-star", "★★★", 3]) {
      assert.equal(normalizeImpactLevel(value), "high")
    }
  })

  it("maps United States country aliases to US", () => {
    assert.equal(normalizeUsCountry("United States"), "US")
    assert.equal(normalizeUsCountry("USA"), "US")
    assert.equal(normalizeUsCountry("US"), "US")
  })
})

describe("CPI name normalization", () => {
  it("maps MoM/YoY/Core CPI into distinct groups", () => {
    assert.equal(normalizeUsMacroEventName("CPI (MoM)"), "cpi_mom")
    assert.equal(normalizeUsMacroEventName("CPI (YoY)"), "cpi_yoy")
    assert.equal(normalizeUsMacroEventName("Core CPI (YoY)"), "core_cpi_yoy")
    assert.equal(normalizeUsMacroEventName("Core CPI (MoM)"), "core_cpi_mom")
  })

  it("keeps CPI MoM/YoY in the CPI priority band", () => {
    assert.equal(getUsMacroEventPriority("CPI (MoM)"), 92)
    assert.equal(getUsMacroEventPriority("CPI (YoY)"), 92)
    assert.equal(getUsMacroEventPriority("Core CPI (YoY)"), 90)
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

    const { events } = filterUsMacroCandidates(records, now - 86_400_000)
    const selected = selectTopUsMacroEvents(events)
    assert.equal(selected.length, 3)
    assert.equal(selected[0]?.event, "FOMC Rate Decision")
    assert.ok(selected.some((event) => event.event === "Nonfarm Payrolls"))
    assert.ok(selected.some((event) => event.event === "US CPI"))
    assert.equal(
      selected.some((event) => event.event === "Initial Jobless Claims"),
      false,
    )
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

  it("falls back to normalized name + publishedAt when id is absent", () => {
    const event = mapRecordToUsEvent(
      makeRecord({ id: "", event: "CPI (MoM)", actual: "-0.4%", forecast: "-0.1%" }),
    )
    const key = usMacroEventDedupKey({ ...event, id: "" })
    assert.match(key, /^name:cpi_mom\|at:/)
  })

  it("does not collapse distinct CPI MoM/YoY/Core releases by base name", () => {
    const releasedAt = "2026-07-14T12:30:00.000Z"
    const events = [
      mapRecordToUsEvent(
        makeRecord({
          id: "",
          event: "CPI (MoM)",
          actual: "-0.4%",
          forecast: "-0.1%",
          publishedAt: releasedAt,
        }),
      ),
      mapRecordToUsEvent(
        makeRecord({
          id: "",
          event: "CPI (YoY)",
          actual: "3.5%",
          forecast: "3.8%",
          publishedAt: releasedAt,
        }),
      ),
      mapRecordToUsEvent(
        makeRecord({
          id: "",
          event: "Core CPI (YoY)",
          actual: "2.6%",
          forecast: "2.85%",
          publishedAt: releasedAt,
        }),
      ),
    ].map((event) => ({ ...event, id: "" }))

    const { events: deduped } = deduplicateUsMacroEvents(events)
    assert.equal(deduped.length, 3)
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

    const { events, debugRows } = filterUsMacroCandidates(records, now - 86_400_000)
    assert.equal(events.length, 1)
    assert.equal(events[0]?.event, "US CPI")
    assert.ok(debugRows.some((row) => row.rejectionReason === "not_us"))
    assert.ok(debugRows.some((row) => row.rejectionReason === "missing_actual"))
    assert.ok(debugRows.some((row) => row.rejectionReason === "not_high_impact"))
  })

  it("accepts United States country and High Impact aliases", () => {
    const now = Date.now()
    const records = [
      makeRecord({
        id: "us-full",
        event: "CPI (YoY)",
        country: "United States",
        impact: "High Impact" as EconomicEventRecord["impact"],
        actual: "3.5%",
        forecast: "3.8%",
        publishedAt: new Date(now - 3_600_000).toISOString(),
      }),
    ]

    // Cast through mapRecord path by manually setting impact string on record
    const raw = {
      ...records[0],
      impact: "High Impact",
    } as unknown as EconomicEventRecord

    const { events } = filterUsMacroCandidates([raw], now - 86_400_000, now)
    assert.equal(events.length, 1)
    assert.equal(events[0]?.normalizedName, "cpi_yoy")
  })
})

describe("2026-07-14 CPI regression", () => {
  it("includes negative MoM CPI and formats the expected US Macro block", () => {
    const previousReport = vietnamWallTimeToUtcMs("2026-07-14", 7, 0)
    const currentReport = vietnamWallTimeToUtcMs("2026-07-15", 7, 0)
    // 2026-07-14 08:30 ET = 12:30 UTC
    const releasedAt = "2026-07-14T12:30:00.000Z"

    assert.ok(previousReport < Date.parse(releasedAt))
    assert.ok(Date.parse(releasedAt) < currentReport)

    const records = [
      makeRecord({
        id: "cpi-mom",
        event: "CPI (MoM)",
        actual: "-0.4%",
        forecast: "-0.1%",
        publishedAt: releasedAt,
      }),
      makeRecord({
        id: "cpi-yoy",
        event: "CPI (YoY)",
        actual: "3.5%",
        forecast: "3.8%",
        publishedAt: releasedAt,
      }),
      makeRecord({
        id: "core-cpi-yoy",
        event: "Core CPI (YoY)",
        actual: "2.6%",
        forecast: "2.85%",
        publishedAt: releasedAt,
      }),
      makeRecord({
        id: "jobless",
        event: "Initial Jobless Claims",
        actual: "220K",
        forecast: "230K",
        publishedAt: releasedAt,
      }),
    ]

    const { events, debugRows } = filterUsMacroCandidates(
      records,
      previousReport,
      currentReport,
    )
    assert.equal(
      debugRows.filter((row) => row.rejectionReason === "accepted").length,
      4,
    )

    const selected = selectTopUsMacroEvents(events)
    assert.equal(selected.length, 3)
    assert.deepEqual(
      selected.map((event) => event.normalizedName),
      ["cpi_mom", "cpi_yoy", "core_cpi_yoy"],
    )

    const summary = buildUsMacroSummary(selected)
    assert.equal(
      summary,
      [
        "• CPI Mỹ theo tháng: -0.4%, thấp hơn dự báo -0.1%.",
        "  → Cho thấy áp lực giá tiêu dùng giảm trong tháng.",
        "",
        "• CPI Mỹ theo năm: 3.5%, thấp hơn dự báo 3.8%.",
        "  → Cho thấy áp lực lạm phát hạ nhiệt.",
        "",
        "• Core CPI Mỹ: 2.6%, thấp hơn dự báo 2.85%.",
        "  → Cho thấy lạm phát cơ bản giảm.",
      ].join("\n"),
    )
    assert.equal(containsForbiddenUsMacroTerms(summary), false)
  })

  it("resolves previous report window from Vietnam 07:00 wall time", () => {
    const since = resolveUsMacroSinceMs({ date: "2026-07-14" })
    assert.equal(since, vietnamWallTimeToUtcMs("2026-07-14", 7, 0))
  })
})

describe("forbidden market-direction terms", () => {
  it("flags banned phrases", () => {
    assert.equal(containsForbiddenUsMacroTerms("Hỗ trợ vàng trong ngắn hạn"), true)
    assert.equal(containsForbiddenUsMacroTerms("Cho thấy áp lực lạm phát đang giảm."), false)
  })
})
