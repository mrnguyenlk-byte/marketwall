import { getSiteSettings } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

export async function GET() {
  const settings = await getSiteSettings()
  return Response.json({ settings })
}
