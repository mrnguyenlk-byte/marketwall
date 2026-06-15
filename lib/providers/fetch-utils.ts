export const DEFAULT_FETCH_TIMEOUT_MS = 8_000

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...init.headers,
      },
      next: { revalidate: 60 },
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function safeFetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs?: number,
): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url, init, timeoutMs)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
