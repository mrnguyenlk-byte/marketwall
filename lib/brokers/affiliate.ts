import type { BrokerRecord } from "@/types/broker"

const DEFAULT_REF = "marketwall"

type AffiliateOptions = {
  source?: string
  campaign?: string
}

/** Build outbound URL with affiliate / UTM tracking parameters. */
export function buildAffiliateUrl(broker: BrokerRecord, options: AffiliateOptions = {}): string {
  const base = broker.affiliateUrl ?? broker.websiteUrl
  let url: URL
  try {
    url = new URL(base)
  } catch {
    return base
  }

  const ref = process.env.BROKER_AFFILIATE_ID?.trim() || DEFAULT_REF
  url.searchParams.set("ref", ref)
  url.searchParams.set("utm_source", options.source ?? "marketwall")
  url.searchParams.set("utm_medium", "referral")
  if (options.campaign) {
    url.searchParams.set("utm_campaign", options.campaign)
  }
  return url.toString()
}
