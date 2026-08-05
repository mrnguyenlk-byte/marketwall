import "server-only"

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

export type R2ObjectBody = Buffer | Uint8Array | string

let cachedClient: S3Client | null = null

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is required for Cloudflare R2 storage`)
  }
  return value
}

/** True when R2 credentials are configured. */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT?.trim() &&
      process.env.R2_BUCKET?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim(),
  )
}

export function getR2Bucket(): string {
  return requiredEnv("R2_BUCKET")
}

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient

  const endpoint = requiredEnv("R2_ENDPOINT")
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID")
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY")
  const region = process.env.R2_REGION?.trim() || "auto"

  cachedClient = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  })

  return cachedClient
}

/**
 * Public base URL for objects (custom domain or r2.dev).
 * Trailing slash is stripped.
 */
export function getR2PublicBaseUrl(): string {
  const explicit = process.env.R2_PUBLIC_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, "")

  // Fallback: path-style object URL on the S3 API endpoint (works when bucket is public).
  const endpoint = requiredEnv("R2_ENDPOINT").replace(/\/$/, "")
  const bucket = getR2Bucket()
  return `${endpoint}/${bucket}`
}

export function buildR2PublicUrl(key: string): string {
  const normalizedKey = key.replace(/^\//, "")
  return `${getR2PublicBaseUrl()}/${normalizedKey}`
}

export async function putR2Object(input: {
  key: string
  body: R2ObjectBody
  contentType: string
}): Promise<string> {
  const client = getR2Client()
  const bucket = getR2Bucket()
  const key = input.key.replace(/^\//, "")

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  )

  return buildR2PublicUrl(key)
}

/** Creates an object only when its key does not already exist. */
export async function putR2ObjectIfAbsent(input: {
  key: string
  body: R2ObjectBody
  contentType: string
}): Promise<boolean> {
  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: input.key.replace(/^\//, ""),
        Body: input.body,
        ContentType: input.contentType,
        IfNoneMatch: "*",
      }),
    )
    return true
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
      ?.httpStatusCode
    if (status === 412 || (error instanceof Error && error.name === "PreconditionFailed")) {
      return false
    }
    throw error
  }
}

export async function deleteR2Object(key: string): Promise<void> {
  const client = getR2Client()
  const bucket = getR2Bucket()
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key.replace(/^\//, ""),
    }),
  )
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0)
  if (Buffer.isBuffer(body)) return body
  if (body instanceof Uint8Array) return Buffer.from(body)

  const maybe = body as { transformToByteArray?: () => Promise<Uint8Array> }
  if (typeof maybe.transformToByteArray === "function") {
    return Buffer.from(await maybe.transformToByteArray())
  }

  const chunks: Buffer[] = []
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function getR2ObjectText(key: string): Promise<string | null> {
  try {
    const client = getR2Client()
    const response = await client.send(
      new GetObjectCommand({
        Bucket: getR2Bucket(),
        Key: key.replace(/^\//, ""),
      }),
    )
    if (!response.Body) return null
    return (await streamToBuffer(response.Body)).toString("utf-8")
  } catch (error) {
    const name = error instanceof Error ? error.name : ""
    if (name === "NoSuchKey" || name === "NotFound") return null
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
      ?.httpStatusCode
    if (status === 404) return null
    throw error
  }
}

export async function getR2ObjectJson<T>(key: string): Promise<T | null> {
  const text = await getR2ObjectText(key)
  if (text == null || !text.trim()) return null
  return JSON.parse(text) as T
}

export async function listR2ObjectKeys(prefix: string): Promise<
  Array<{ key: string; lastModified?: Date }>
> {
  const client = getR2Client()
  const bucket = getR2Bucket()
  const normalizedPrefix = prefix.replace(/^\//, "")
  const keys: Array<{ key: string; lastModified?: Date }> = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: normalizedPrefix,
        ContinuationToken: continuationToken,
      }),
    )

    for (const item of response.Contents ?? []) {
      if (!item.Key) continue
      keys.push({ key: item.Key, lastModified: item.LastModified })
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  return keys
}
