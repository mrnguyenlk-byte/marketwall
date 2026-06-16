import type {
  BrokerComparisonHighlight,
  BrokerComparisonResult,
  BrokerComparisonRow,
  BrokerRecord,
} from "@/types/broker"
import type { Bi } from "@/lib/market-utils"

type CompareField = {
  id: string
  labelKey: string
  left: string
  right: string
  scoreLeft: number
  scoreRight: number
}

function bi(value: Bi, lang: "en" | "vi"): string {
  return value[lang]
}

function highlightFromScores(left: number, right: number): BrokerComparisonHighlight {
  if (left === right) return "tie"
  return left > right ? "left" : "right"
}

function buildFields(a: BrokerRecord, b: BrokerRecord, lang: "en" | "vi"): CompareField[] {
  return [
    {
      id: "rating",
      labelKey: "brokers.filter.rating",
      left: a.rating.toFixed(1),
      right: b.rating.toFixed(1),
      scoreLeft: a.rating,
      scoreRight: b.rating,
    },
    {
      id: "trustScore",
      labelKey: "label.trustScore",
      left: String(a.trustScore),
      right: String(b.trustScore),
      scoreLeft: a.trustScore,
      scoreRight: b.trustScore,
    },
    {
      id: "minDeposit",
      labelKey: "brokers.filter.minDeposit",
      left: a.minDeposit,
      right: b.minDeposit,
      scoreLeft: a.minDepositValue === 0 ? 100 : 100 - a.minDepositValue,
      scoreRight: b.minDepositValue === 0 ? 100 : 100 - b.minDepositValue,
    },
    {
      id: "spread",
      labelKey: "brokers.filter.spread",
      left: a.spread,
      right: b.spread,
      scoreLeft: a.spreadValue === 0 ? 100 : 100 - a.spreadValue * 10,
      scoreRight: b.spreadValue === 0 ? 100 : 100 - b.spreadValue * 10,
    },
    {
      id: "leverage",
      labelKey: "label.leverage",
      left: a.leverage,
      right: b.leverage,
      scoreLeft: parseLeverageScore(a.leverage),
      scoreRight: parseLeverageScore(b.leverage),
    },
    {
      id: "platforms",
      labelKey: "brokers.filter.platform",
      left: bi(a.platforms, lang),
      right: bi(b.platforms, lang),
      scoreLeft: a.platformTags.length,
      scoreRight: b.platformTags.length,
    },
    {
      id: "license",
      labelKey: "brokers.filter.license",
      left: bi(a.license, lang),
      right: bi(b.license, lang),
      scoreLeft: a.licenseTags.length,
      scoreRight: b.licenseTags.length,
    },
    {
      id: "withdrawal",
      labelKey: "label.withdrawal",
      left: bi(a.withdrawalTime, lang),
      right: bi(b.withdrawalTime, lang),
      scoreLeft: withdrawalScore(a.withdrawalTime.en),
      scoreRight: withdrawalScore(b.withdrawalTime.en),
    },
    {
      id: "region",
      labelKey: "brokers.filter.region",
      left: bi(a.region, lang),
      right: bi(b.region, lang),
      scoreLeft: 1,
      scoreRight: 1,
    },
    {
      id: "accountType",
      labelKey: "brokers.filter.accountType",
      left: bi(a.accountType, lang),
      right: bi(b.accountType, lang),
      scoreLeft: 1,
      scoreRight: 1,
    },
  ]
}

function parseLeverageScore(leverage: string): number {
  const match = leverage.match(/1:(\d+)/)
  if (!match) return leverage === "—" ? 0 : 1
  return Number(match[1]) / 100
}

function withdrawalScore(text: string): number {
  const lower = text.toLowerCase()
  if (lower.includes("instant") || lower.includes("tức thì")) return 100
  if (lower.includes("same day") || lower.includes("trong ngày")) return 80
  if (lower.includes("t+2")) return 40
  return 50
}

/** Side-by-side broker comparison with weighted score totals. */
export function compareBrokers(
  left: BrokerRecord,
  right: BrokerRecord,
  lang: "en" | "vi" = "en",
): BrokerComparisonResult {
  const fields = buildFields(left, right, lang)

  const rows: BrokerComparisonRow[] = fields.map((field) => ({
    id: field.id,
    labelKey: field.labelKey,
    left: field.left,
    right: field.right,
    highlight: highlightFromScores(field.scoreLeft, field.scoreRight),
  }))

  let scoreLeft = 0
  let scoreRight = 0
  for (const field of fields) {
    if (field.scoreLeft > field.scoreRight) scoreLeft += 1
    else if (field.scoreRight > field.scoreLeft) scoreRight += 1
    else {
      scoreLeft += 0.5
      scoreRight += 0.5
    }
  }

  return { left, right, rows, scoreLeft, scoreRight }
}
