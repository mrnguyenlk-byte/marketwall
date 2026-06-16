/** Vietnam equity session (HOSE/HNX) — ICT UTC+7. Proprietary EOD sync should run after close. */

const MARKET_OPEN_HOUR = 9
const MARKET_CLOSE_HOUR = 15

function vietnamNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
}

export function isVietnamEquitySessionOpen(now = vietnamNow()): boolean {
  const day = now.getDay()
  if (day === 0 || day === 6) return false

  const minutes = now.getHours() * 60 + now.getMinutes()
  const open = MARKET_OPEN_HOUR * 60
  const close = MARKET_CLOSE_HOUR * 60
  return minutes >= open && minutes < close
}
