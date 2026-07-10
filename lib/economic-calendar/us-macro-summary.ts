import {
  compareActualToForecast,
  type ForecastComparison,
  type UsEconomicEvent,
  US_MACRO_EMPTY_MESSAGE,
  US_MACRO_MAX_EVENTS,
} from "./us-macro-core"

export { US_MACRO_EMPTY_MESSAGE, US_MACRO_MAX_EVENTS } from "./us-macro-core"

function formatEventLabel(eventName: string): string {
  const name = eventName.trim()
  if (/fomc|federal funds|fed funds|fed interest|fed rate/i.test(name)) return "Fed"
  if (/non[-\s]?farm\s+payrolls|\bnfp\b/i.test(name)) return "Nonfarm Payrolls"
  if (/core\s+cpi/i.test(name)) return "Core CPI Mỹ"
  if (/\bcpi\b/i.test(name)) return "CPI Mỹ"
  if (/core\s+ppi/i.test(name)) return "Core PPI Mỹ"
  if (/\bppi\b/i.test(name)) return "PPI Mỹ"
  if (/core\s+pce/i.test(name)) return "Core PCE Mỹ"
  if (/\bgdp\b/i.test(name)) return "GDP Mỹ"
  if (/unemployment\s+rate/i.test(name)) return "Unemployment Rate Mỹ"
  if (/initial\s+jobless|jobless\s+claims/i.test(name)) return "Jobless Claims"
  if (/retail\s+sales/i.test(name)) return "Retail Sales Mỹ"
  if (/ism\s+manufacturing/i.test(name)) return "ISM Manufacturing Mỹ"
  if (/ism\s+services/i.test(name)) return "ISM Services Mỹ"
  if (/powell|fed.*speech|fed chair/i.test(name)) return "Fed Speech"
  return name
}

function isFedRateEvent(eventName: string): boolean {
  return /fomc|federal funds|fed funds|fed interest|fed rate|interest rate decision/i.test(
    eventName,
  )
}

function isFedSpeechEvent(eventName: string): boolean {
  return /powell|fed.*speech|fed chair|fomc.*minutes/i.test(eventName)
}

function formatComparisonPhrase(
  comparison: ForecastComparison,
  forecast: string | null,
): string {
  const forecastSuffix = forecast ? ` ${forecast}` : ""

  switch (comparison) {
    case "higher":
      return `cao hơn dự báo${forecastSuffix}`
    case "lower":
      return `thấp hơn dự báo${forecastSuffix}`
    case "in_line":
      return forecast ? `phù hợp với dự báo ${forecast}` : "phù hợp với dự báo"
    default:
      return ""
  }
}

function formatHeadline(event: UsEconomicEvent, comparison: ForecastComparison): string {
  const label = formatEventLabel(event.event)
  const actual = (event.actual ?? event.verifiedContent ?? "").trim()

  if (isFedRateEvent(event.event)) {
    if (comparison === "in_line") {
      const rateText = actual.replace(/\.$/, "")
      return `• Fed giữ nguyên lãi suất ${rateText}.`
    }
    if (comparison === "unknown" || !event.forecast) {
      return `• Fed: ${actual}.`
    }
    const comparisonPhrase = formatComparisonPhrase(comparison, event.forecast)
    return `• Fed: ${actual}, ${comparisonPhrase}.`
  }

  if (isFedSpeechEvent(event.event)) {
    return `• ${label}: ${actual}.`
  }

  if (!event.forecast || comparison === "unknown") {
    return `• ${label}: ${actual}.`
  }

  const comparisonPhrase = formatComparisonPhrase(comparison, event.forecast)
  return `• ${label}: ${actual}, ${comparisonPhrase}.`
}

function inflationTemplate(comparison: ForecastComparison): string {
  if (comparison === "higher") return "Cho thấy áp lực lạm phát đang tăng."
  if (comparison === "lower") return "Cho thấy áp lực lạm phát đang giảm."
  return "Cho thấy áp lực lạm phát chưa thay đổi đáng kể."
}

function explainEconomicIndication(
  event: UsEconomicEvent,
  comparison: ForecastComparison,
): string {
  const name = event.event.toLowerCase()

  if (isFedSpeechEvent(name)) {
    const content = (event.verifiedContent ?? event.actual ?? "").trim()
    return content
      ? `Tóm tắt trọng tâm phát biểu: ${content}`
      : "Tóm tắt trọng tâm phát biểu đã được công bố."
  }

  if (isFedRateEvent(name)) {
    if (comparison === "in_line") return "Chính sách tiền tệ được giữ nguyên."
    return "Chính sách tiền tệ đã được điều chỉnh."
  }

  if (/core\s+cpi|\bcpi\b/i.test(name) && !/ppi/i.test(name)) {
    return inflationTemplate(comparison)
  }

  if (/ppi/i.test(name)) {
    if (comparison === "higher") return "Phản ánh áp lực giá từ phía sản xuất đang tăng."
    if (comparison === "lower") return "Phản ánh áp lực giá từ phía sản xuất đang giảm."
    return "Phản ánh áp lực giá từ phía sản xuất chưa thay đổi đáng kể."
  }

  if (/non[-\s]?farm\s+payrolls|\bnfp\b/i.test(name)) {
    if (comparison === "higher") return "Cho thấy thị trường lao động đang mở rộng."
    if (comparison === "lower") return "Cho thấy thị trường lao động đang chậm lại."
    return "Cho thấy thị trường lao động chưa thay đổi đáng kể."
  }

  if (/unemployment\s+rate/i.test(name)) {
    if (comparison === "lower") return "Phản ánh mức độ mạnh của thị trường lao động."
    if (comparison === "higher") return "Phản ánh mức độ yếu của thị trường lao động."
    return "Phản ánh thị trường lao động chưa thay đổi đáng kể."
  }

  if (/core\s+pce/i.test(name)) {
    if (comparison === "higher") {
      return "Cho thấy diễn biến của lạm phát cơ bản mà Fed theo dõi sát đang tăng."
    }
    if (comparison === "lower") {
      return "Cho thấy diễn biến của lạm phát cơ bản mà Fed theo dõi sát đang giảm."
    }
    return "Cho thấy diễn biến của lạm phát cơ bản mà Fed theo dõi sát chưa thay đổi đáng kể."
  }

  if (/\bgdp\b/i.test(name)) {
    if (comparison === "higher") return "Cho thấy tốc độ tăng trưởng kinh tế đang cải thiện."
    if (comparison === "lower") return "Cho thấy tốc độ tăng trưởng kinh tế đang chậm lại."
    return "Cho thấy tốc độ tăng trưởng kinh tế chưa thay đổi đáng kể."
  }

  if (/retail\s+sales/i.test(name)) {
    if (comparison === "higher") return "Phản ánh sức chi tiêu của người tiêu dùng đang tăng."
    if (comparison === "lower") return "Phản ánh sức chi tiêu của người tiêu dùng đang giảm."
    return "Phản ánh sức chi tiêu của người tiêu dùng chưa thay đổi đáng kể."
  }

  if (/ism/i.test(name)) {
    if (comparison === "higher") return "Cho thấy hoạt động kinh doanh đang mở rộng."
    if (comparison === "lower") return "Cho thấy hoạt động kinh doanh đang thu hẹp."
    return "Cho thấy hoạt động kinh doanh chưa thay đổi đáng kể."
  }

  if (/jobless/i.test(name)) {
    if (comparison === "lower") return "Cho thấy thị trường lao động đang mở rộng."
    if (comparison === "higher") return "Cho thấy thị trường lao động đang chậm lại."
    return "Cho thấy thị trường lao động chưa thay đổi đáng kể."
  }

  if (comparison === "higher") return "Chỉ số kinh tế cao hơn kỳ vọng."
  if (comparison === "lower") return "Chỉ số kinh tế thấp hơn kỳ vọng."
  return "Chỉ số kinh tế phù hợp với kỳ vọng."
}

export function formatUsMacroEventBlock(event: UsEconomicEvent): string {
  const actual = event.actual ?? event.verifiedContent ?? ""
  const comparison = event.forecast
    ? compareActualToForecast(actual, event.forecast)
    : "unknown"
  const headline = formatHeadline(event, comparison)
  const explanation = explainEconomicIndication(event, comparison)
  return `${headline}\n→ ${explanation}`
}

/** Build deterministic US Macro section content from selected events. */
export function buildUsMacroSummary(events: UsEconomicEvent[]): string {
  const released = events
    .filter((event) => event.impact === "high")
    .slice(0, US_MACRO_MAX_EVENTS)

  if (!released.length) return US_MACRO_EMPTY_MESSAGE

  return released.map(formatUsMacroEventBlock).join("\n\n")
}
