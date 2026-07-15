import {
  compareActualToForecast,
  type ForecastComparison,
  type UsEconomicEvent,
  US_MACRO_EMPTY_MESSAGE,
  US_MACRO_MAX_EVENTS,
  normalizeUsMacroEventName,
} from "./us-macro-core"

export { US_MACRO_EMPTY_MESSAGE, US_MACRO_MAX_EVENTS } from "./us-macro-core"

function formatEventLabel(eventName: string): string {
  const key = normalizeUsMacroEventName(eventName)

  switch (key) {
    case "fomc_rate":
      return "Fed"
    case "nfp":
      return "Nonfarm Payrolls"
    case "cpi_mom":
      return "CPI Mỹ theo tháng"
    case "cpi_yoy":
      return "CPI Mỹ theo năm"
    case "core_cpi_mom":
      return "Core CPI Mỹ theo tháng"
    case "core_cpi_yoy":
    case "core_cpi":
      return "Core CPI Mỹ"
    case "cpi":
      return "CPI Mỹ"
    case "ppi":
      return "PPI Mỹ"
    case "core_pce":
      return "Core PCE Mỹ"
    case "gdp":
      return "GDP Mỹ"
    case "unemployment_rate":
      return "Unemployment Rate Mỹ"
    case "jobless_claims":
      return "Jobless Claims"
    case "retail_sales":
      return "Retail Sales Mỹ"
    case "ism_manufacturing":
      return "ISM Manufacturing Mỹ"
    case "ism_services":
      return "ISM Services Mỹ"
    case "fed_speech":
      return "Fed Speech"
    default:
      break
  }

  return eventName.trim()
}

function isFedRateEvent(eventName: string): boolean {
  return normalizeUsMacroEventName(eventName) === "fomc_rate"
}

function isFedSpeechEvent(eventName: string): boolean {
  return normalizeUsMacroEventName(eventName) === "fed_speech"
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
    if (comparison === "unknown" || event.forecast === null) {
      return `• Fed: ${actual}.`
    }
    const comparisonPhrase = formatComparisonPhrase(comparison, event.forecast)
    return `• Fed: ${actual}, ${comparisonPhrase}.`
  }

  if (isFedSpeechEvent(event.event)) {
    return `• ${label}: ${actual}.`
  }

  if (event.forecast === null || comparison === "unknown") {
    return `• ${label}: ${actual}.`
  }

  const comparisonPhrase = formatComparisonPhrase(comparison, event.forecast)
  return `• ${label}: ${actual}, ${comparisonPhrase}.`
}

function explainEconomicIndication(
  event: UsEconomicEvent,
  comparison: ForecastComparison,
): string {
  const key = normalizeUsMacroEventName(event.event)

  if (key === "fed_speech") {
    const content = (event.verifiedContent ?? event.actual ?? "").trim()
    return content
      ? `Tóm tắt trọng tâm phát biểu: ${content}`
      : "Tóm tắt trọng tâm phát biểu đã được công bố."
  }

  if (key === "fomc_rate") {
    if (comparison === "in_line") return "Chính sách tiền tệ được giữ nguyên."
    return "Chính sách tiền tệ đã được điều chỉnh."
  }

  if (key === "cpi_mom") {
    if (comparison === "higher") return "Cho thấy áp lực giá tiêu dùng tăng trong tháng."
    if (comparison === "lower") return "Cho thấy áp lực giá tiêu dùng giảm trong tháng."
    return "Cho thấy áp lực giá tiêu dùng chưa thay đổi đáng kể trong tháng."
  }

  if (key === "cpi_yoy" || key === "cpi") {
    if (comparison === "higher") return "Cho thấy áp lực lạm phát tăng."
    if (comparison === "lower") return "Cho thấy áp lực lạm phát hạ nhiệt."
    return "Cho thấy áp lực lạm phát chưa thay đổi đáng kể."
  }

  if (key === "core_cpi" || key === "core_cpi_mom" || key === "core_cpi_yoy") {
    if (comparison === "higher") return "Cho thấy lạm phát cơ bản tăng."
    if (comparison === "lower") return "Cho thấy lạm phát cơ bản giảm."
    return "Cho thấy lạm phát cơ bản chưa thay đổi đáng kể."
  }

  if (key === "ppi") {
    if (comparison === "higher") return "Phản ánh áp lực giá từ phía sản xuất đang tăng."
    if (comparison === "lower") return "Phản ánh áp lực giá từ phía sản xuất đang giảm."
    return "Phản ánh áp lực giá từ phía sản xuất chưa thay đổi đáng kể."
  }

  if (key === "nfp") {
    if (comparison === "higher") return "Cho thấy thị trường lao động đang mở rộng."
    if (comparison === "lower") return "Cho thấy thị trường lao động đang chậm lại."
    return "Cho thấy thị trường lao động chưa thay đổi đáng kể."
  }

  if (key === "unemployment_rate") {
    if (comparison === "lower") return "Phản ánh mức độ mạnh của thị trường lao động."
    if (comparison === "higher") return "Phản ánh mức độ yếu của thị trường lao động."
    return "Phản ánh thị trường lao động chưa thay đổi đáng kể."
  }

  if (key === "core_pce") {
    if (comparison === "higher") {
      return "Cho thấy diễn biến của lạm phát cơ bản mà Fed theo dõi sát đang tăng."
    }
    if (comparison === "lower") {
      return "Cho thấy diễn biến của lạm phát cơ bản mà Fed theo dõi sát đang giảm."
    }
    return "Cho thấy diễn biến của lạm phát cơ bản mà Fed theo dõi sát chưa thay đổi đáng kể."
  }

  if (key === "gdp") {
    if (comparison === "higher") return "Cho thấy tốc độ tăng trưởng kinh tế đang cải thiện."
    if (comparison === "lower") return "Cho thấy tốc độ tăng trưởng kinh tế đang chậm lại."
    return "Cho thấy tốc độ tăng trưởng kinh tế chưa thay đổi đáng kể."
  }

  if (key === "retail_sales") {
    if (comparison === "higher") return "Phản ánh sức chi tiêu của người tiêu dùng đang tăng."
    if (comparison === "lower") return "Phản ánh sức chi tiêu của người tiêu dùng đang giảm."
    return "Phản ánh sức chi tiêu của người tiêu dùng chưa thay đổi đáng kể."
  }

  if (key === "ism_manufacturing" || key === "ism_services") {
    if (comparison === "higher") return "Cho thấy hoạt động kinh doanh đang mở rộng."
    if (comparison === "lower") return "Cho thấy hoạt động kinh doanh đang thu hẹp."
    return "Cho thấy hoạt động kinh doanh chưa thay đổi đáng kể."
  }

  if (key === "jobless_claims") {
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
  const comparison =
    event.forecast !== null && event.forecast !== undefined && event.forecast !== ""
      ? compareActualToForecast(actual, event.forecast)
      : "unknown"
  const headline = formatHeadline(event, comparison)
  const explanation = explainEconomicIndication(event, comparison)
  return `${headline}\n  → ${explanation}`
}

/** Build deterministic US Macro section content from selected events. */
export function buildUsMacroSummary(events: UsEconomicEvent[]): string {
  const released = events
    .filter((event) => event.impact === "high")
    .slice(0, US_MACRO_MAX_EVENTS)

  if (!released.length) return US_MACRO_EMPTY_MESSAGE

  return released.map(formatUsMacroEventBlock).join("\n\n")
}
