const MAX_ATTEMPTS = 2
const REQUEST_TIMEOUT_MS = 45_000

function log(event, fields = {}) {
  console.log(JSON.stringify({
    service: "btrading-telegram-news-scheduler",
    event,
    ...fields,
  }))
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function invokeBTrading(env, scheduledTime, attempt) {
  const endpoint = env.BTRADING_NEWS_ENDPOINT?.trim()
  const secret = env.BTRADING_AUTOMATION_SECRET?.trim()
  if (!endpoint) throw new Error("BTRADING_NEWS_ENDPOINT is not configured")
  if (!secret) throw new Error("BTRADING_AUTOMATION_SECRET is not configured")

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const startedAt = Date.now()
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
        "x-btrading-scheduler": "cloudflare-cron",
      },
      body: JSON.stringify({ scheduledTime }),
      signal: controller.signal,
    })
    const body = (await response.text()).slice(0, 4_000)
    let payload = null
    try { payload = JSON.parse(body) } catch { /* response is logged as text */ }

    log("origin_response", {
      attempt,
      statusCode: response.status,
      durationMs: Date.now() - startedAt,
      result: payload?.status ?? null,
      reason: payload?.reason ?? null,
      skippedReasons: payload?.skippedReasons ?? null,
    })

    if (!response.ok || payload?.ok === false || payload?.status === "failed") {
      const error = new Error(`BTrading endpoint failed with HTTP ${response.status}`)
      error.retryable = response.status >= 500 || response.status === 429 || payload?.status === "failed"
      throw error
    }
    return payload
  } finally {
    clearTimeout(timeout)
  }
}

async function runScheduled(env, scheduledTime) {
  let lastError
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const payload = await invokeBTrading(env, scheduledTime, attempt)
      log("completed", {
        scheduledTime,
        attempt,
        result: payload?.status ?? "ok",
        publishedCount: Array.isArray(payload?.published) ? payload.published.length : 0,
      })
      return
    } catch (error) {
      lastError = error
      const retryable = error?.retryable !== false
      log("attempt_failed", {
        scheduledTime,
        attempt,
        retryable,
        error: error instanceof Error ? error.message : String(error),
      })
      if (!retryable || attempt === MAX_ATTEMPTS) break
      await wait(5_000)
    }
  }
  throw lastError ?? new Error("Unknown scheduler failure")
}

const worker = {
  async scheduled(controller, env, ctx) {
    const scheduledTime = new Date(controller.scheduledTime).toISOString()
    log("started", { scheduledTime, cron: controller.cron })
    ctx.waitUntil(runScheduled(env, scheduledTime))
  },

  async fetch(request) {
    const url = new URL(request.url)
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "btrading-telegram-news-scheduler",
        schedule: "every minute",
      })
    }
    return new Response("Not Found", { status: 404 })
  },
}

export default worker
