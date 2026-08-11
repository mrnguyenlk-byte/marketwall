import assert from "node:assert/strict"
import test from "node:test"

import { getMarketAlertRunPlan, getVietnamDateHour } from "./market-alert-schedule.ts"

test("uses Vietnam time for the hourly Gold window", () => {
  const now = new Date("2026-08-11T17:02:00.000Z") // 00:02 in Vietnam
  assert.deepEqual(getVietnamDateHour(now), {
    date: "2026-08-12",
    hour: 0,
    minute: 2,
  })
  assert.equal(getMarketAlertRunPlan(now).lanes.includes("gold"), true)
})

test("paces international RSS to even minutes", () => {
  const even = getMarketAlertRunPlan(new Date("2026-08-11T00:08:00.000Z"))
  const odd = getMarketAlertRunPlan(new Date("2026-08-11T00:09:00.000Z"))
  assert.equal(even.lanes.includes("international-news"), true)
  assert.equal(odd.lanes.includes("international-news"), false)
})

test("paces Trump RSS to every third minute", () => {
  const due = getMarketAlertRunPlan(new Date("2026-08-11T00:09:00.000Z"))
  const notDue = getMarketAlertRunPlan(new Date("2026-08-11T00:10:00.000Z"))
  assert.equal(due.lanes.includes("trump"), true)
  assert.equal(notDue.lanes.includes("trump"), false)
})

test("always keeps the economic lane available", () => {
  for (let minute = 0; minute < 60; minute += 1) {
    const now = new Date(`2026-08-11T00:${String(minute).padStart(2, "0")}:00.000Z`)
    assert.equal(getMarketAlertRunPlan(now).lanes.includes("economic"), true)
  }
})
