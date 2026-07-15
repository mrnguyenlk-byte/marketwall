import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildUsMacroSummary,
  formatUsMacroEventBlock,
  US_MACRO_EMPTY_MESSAGE,
} from "./us-macro-summary"
import {
  compareActualToForecast,
  containsForbiddenUsMacroTerms,
  normalizeUsMacroEventName,
  type UsEconomicEvent,
} from "./us-macro-core"

function makeEvent(overrides: Partial<UsEconomicEvent>): UsEconomicEvent {
  const eventName = overrides.event ?? "US CPI"
  const publishedAt = overrides.publishedAt ?? new Date().toISOString()
  return {
    id: "event-1",
    event: eventName,
    normalizedName: normalizeUsMacroEventName(eventName),
    actual: "2.4%",
    forecast: "2.5%",
    previous: "2.6%",
    impact: "high",
    publishedAt,
    normalizedPublishedAt: publishedAt,
    verifiedContent: null,
    ...overrides,
    normalizedName:
      overrides.normalizedName ??
      normalizeUsMacroEventName(overrides.event ?? eventName),
  }
}

describe("formatUsMacroEventBlock", () => {
  it("formats lower-than-forecast CPI with two lines", () => {
    const block = formatUsMacroEventBlock(makeEvent({}))
    assert.match(block, /^• CPI Mỹ: 2\.4%, thấp hơn dự báo 2\.5%\.$/m)
    assert.match(block, /\n  → Cho thấy áp lực lạm phát hạ nhiệt\.$/)
  })

  it("formats higher-than-forecast headline", () => {
    const block = formatUsMacroEventBlock(
      makeEvent({ actual: "2.6%", forecast: "2.5%" }),
    )
    assert.match(block, /cao hơn dự báo 2\.5%/)
    assert.match(block, /áp lực lạm phát tăng/)
  })

  it("formats in-line forecast headline", () => {
    const block = formatUsMacroEventBlock(
      makeEvent({ actual: "2.50%", forecast: "2.50%" }),
    )
    assert.match(block, /phù hợp với dự báo 2\.50%/)
  })

  it("omits forecast comparison when forecast is missing", () => {
    const block = formatUsMacroEventBlock(
      makeEvent({ event: "Nonfarm Payrolls", actual: "145K", forecast: null }),
    )
    assert.match(block, /^• Nonfarm Payrolls: 145K\.$/m)
    assert.doesNotMatch(block, /cao hơn dự báo|thấp hơn dự báo/)
  })

  it("formats unchanged Fed rate decision", () => {
    const block = formatUsMacroEventBlock(
      makeEvent({
        event: "FOMC Rate Decision",
        actual: "4.25-4.50%",
        forecast: "4.25-4.50%",
      }),
    )
    assert.match(block, /^• Fed giữ nguyên lãi suất 4\.25-4\.50%\.$/m)
    assert.match(block, /→ Chính sách tiền tệ được giữ nguyên\./)
  })

  it("formats NFP slowdown template", () => {
    const block = formatUsMacroEventBlock(
      makeEvent({
        event: "Nonfarm Payrolls",
        actual: "145K",
        forecast: "180K",
      }),
    )
    assert.match(block, /thấp hơn dự báo 180K/)
    assert.match(block, /thị trường lao động đang chậm lại/)
  })
})

describe("buildUsMacroSummary", () => {
  it("returns empty-state copy when no events", () => {
    assert.equal(buildUsMacroSummary([]), US_MACRO_EMPTY_MESSAGE)
  })

  it("joins up to three event blocks", () => {
    const summary = buildUsMacroSummary([
      makeEvent({ id: "1", event: "US CPI", actual: "2.4%", forecast: "2.5%" }),
      makeEvent({
        id: "2",
        event: "Nonfarm Payrolls",
        actual: "145K",
        forecast: "180K",
      }),
      makeEvent({
        id: "3",
        event: "FOMC Rate Decision",
        actual: "4.25-4.50%",
        forecast: "4.25-4.50%",
      }),
      makeEvent({
        id: "4",
        event: "Retail Sales",
        actual: "0.4%",
        forecast: "0.3%",
      }),
    ])

    const blocks = summary.split("\n\n")
    assert.equal(blocks.length, 3)
    assert.equal(containsForbiddenUsMacroTerms(summary), false)
  })

  it("never emits banned market-direction keywords", () => {
    const samples = [
      formatUsMacroEventBlock(makeEvent({ actual: "2.6%", forecast: "2.5%" })),
      formatUsMacroEventBlock(
        makeEvent({ event: "Nonfarm Payrolls", actual: "145K", forecast: "180K" }),
      ),
      formatUsMacroEventBlock(
        makeEvent({
          event: "FOMC Rate Decision",
          actual: "4.25-4.50%",
          forecast: "4.25-4.50%",
        }),
      ),
    ]

    for (const sample of samples) {
      assert.equal(containsForbiddenUsMacroTerms(sample), false)
      assert.doesNotMatch(sample, /\bUSD\b/i)
      assert.doesNotMatch(sample, /\bVNINDEX\b/i)
      assert.doesNotMatch(sample, /vàng/i)
      assert.doesNotMatch(sample, /chứng khoán/i)
    }
  })
})

describe("compareActualToForecast integration", () => {
  it("supports payroll shorthand units", () => {
    assert.equal(compareActualToForecast("145K", "180K"), "lower")
  })
})
