import "server-only"

type SourceLike = { source?: string }

/** Wrap provider payloads for API routes — never throws. */
export function toApiJson<T extends SourceLike>(payload: T): T & {
  fallback: boolean
  updatedAt: string
} {
  const source = payload.source ?? "mock"
  return {
    ...payload,
    source,
    fallback: source !== "live",
    updatedAt: new Date().toISOString(),
  }
}

export function toApiJsonFromMock<T extends SourceLike>(mock: T): T & {
  fallback: boolean
  updatedAt: string
} {
  return toApiJson({ ...mock, source: mock.source ?? "mock" })
}
