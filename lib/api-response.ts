import "server-only"

type SourceLike = { source?: string }

/** Wrap provider payloads for API routes — never throws. */
export function toApiJson<T extends SourceLike & { updatedAt?: string; nextUpdateAt?: string }>(
  payload: T,
): T & {
  fallback: boolean
  updatedAt: string
  nextUpdateAt?: string
} {
  const source = payload.source ?? "mock"
  return {
    ...payload,
    source,
    fallback: source === "mock",
    updatedAt: payload.updatedAt ?? new Date().toISOString(),
    nextUpdateAt: payload.nextUpdateAt,
  }
}

export function toApiJsonFromMock<T extends SourceLike>(mock: T): T & {
  fallback: boolean
  updatedAt: string
} {
  return toApiJson({ ...mock, source: mock.source ?? "mock" })
}
