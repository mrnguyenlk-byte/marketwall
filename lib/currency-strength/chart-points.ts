export type StrengthChartPoint = { time: number; value: number }

/** Unix day used as chart "Open" anchor (time scale hidden; labels rendered separately). */
const SNAPSHOT_OPEN_TIME = 1_704_067_200
const DAY_SECONDS = 86_400

/**
 * Snapshot 1D series: flat Open → Close at current strength.
 * No synthetic intraday waves — only valid when provider returns a single snapshot.
 */
export function buildStrengthChartPoints(strength: number): StrengthChartPoint[] {
  const value = Number(strength.toFixed(2))
  return [
    { time: SNAPSHOT_OPEN_TIME, value },
    { time: SNAPSHOT_OPEN_TIME + DAY_SECONDS, value },
  ]
}
