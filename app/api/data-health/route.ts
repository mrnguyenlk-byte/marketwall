import { buildDataHealthReport } from "@/lib/data-health/build-health-report"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const report = await buildDataHealthReport()
    return Response.json(report)
  } catch (error) {
    const message = error instanceof Error ? error.message : "data health probe failed"
    return Response.json(
      {
        generatedAt: new Date().toISOString(),
        error: message,
        vietnam: { sourceStatus: "unavailable", warnings: [message] },
        foreignFlow: { sourceStatus: "unavailable", warnings: [message] },
        proprietaryFlow: { sourceStatus: "unavailable", warnings: [message] },
        us: { sourceStatus: "unavailable", warnings: [message] },
        crypto: { sourceStatus: "unavailable", warnings: [message] },
        global: { sourceStatus: "unavailable", warnings: [message] },
      },
      { status: 503 },
    )
  }
}
