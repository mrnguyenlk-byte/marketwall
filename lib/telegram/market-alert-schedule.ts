export type MarketAlertLane = "economic" | "international-news" | "trump" | "gold"

export type MarketAlertRunPlan = {
  lanes: MarketAlertLane[]
  vietnamMinute: number
}

export function getVietnamDateHour(
  date: Date,
): { date: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  }
}

/**
 * Keep the scheduler at one minute for economic releases, while pacing the
 * upstream lanes that do not benefit from a one-minute full refresh.
 */
export function getMarketAlertRunPlan(now: Date): MarketAlertRunPlan {
  const local = getVietnamDateHour(now)
  const lanes: MarketAlertLane[] = ["economic"]
  if (local.minute % 2 === 0) lanes.push("international-news")
  if (local.minute % 3 === 0) lanes.push("trump")
  if (local.minute < 5) lanes.push("gold")
  return { lanes, vietnamMinute: local.minute }
}
