import "server-only"

import { putR2Object } from "@/lib/r2"

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "")
  } catch {
    return null
  }
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "BTrading-BrokerLogo/1.0" },
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) return null

    const contentType = response.headers.get("content-type") ?? "image/png"
    if (!contentType.startsWith("image/")) return null

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    if (buffer.length < 64) return null

    return { buffer, contentType }
  } catch {
    return null
  }
}

/** Try Clearbit then Google favicon for a domain. */
export async function fetchBrokerLogoBuffer(
  websiteUrl: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const domain = domainFromUrl(websiteUrl)
  if (!domain) return null

  const candidates = [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ]

  for (const url of candidates) {
    const result = await downloadImage(url)
    if (result) return result
  }

  return null
}

/** Fetch remote logo and persist to R2; returns public URL. */
export async function persistBrokerLogoFromWebsite(
  slug: string,
  websiteUrl: string,
): Promise<string | null> {
  const fetched = await fetchBrokerLogoBuffer(websiteUrl)
  if (!fetched) return null

  const ext = fetched.contentType.includes("jpeg")
    ? "jpg"
    : fetched.contentType.includes("webp")
      ? "webp"
      : "png"

  return putR2Object({
    key: `admin/brokers/${slug}.${ext}`,
    body: fetched.buffer,
    contentType: fetched.contentType,
  })
}
