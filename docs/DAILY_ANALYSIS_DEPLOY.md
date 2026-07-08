# Daily analysis automation — Vercel deployment

The `/api/automation/daily-analysis/run` endpoint uploads chart images and persists generated articles. On Vercel/serverless, the project filesystem is read-only — writes to `public/` or `content/` fail with `ENOENT`.

## Required environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DAILY_AUTOMATION_SECRET` | Vercel + local | Bearer secret for automation POST requests |
| `R2_ENDPOINT` | **Vercel (required)** | Cloudflare R2 S3 API endpoint |
| `R2_BUCKET` | **Vercel (required)** | R2 bucket name |
| `R2_ACCESS_KEY_ID` | **Vercel (required)** | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | **Vercel (required)** | R2 API token secret |
| `R2_REGION` | Vercel + local | Defaults to `auto` |
| `R2_PUBLIC_URL` | **Vercel (recommended)** | Public base URL for objects (custom domain or `*.r2.dev`) |
| `OPENAI_API_KEY` | Vercel + local | OpenAI content generation (falls back to mock if unset) |

Optional:

- `DAILY_ANALYSIS_OPENAI_MODEL` — defaults to `gpt-4o-mini`

## Storage behavior

- **Local dev** (R2 unset): files under `public/uploads/daily-analysis/` and `content/daily-analysis/`.
- **Vercel production** (R2 configured): images and articles stored in Cloudflare R2 under `daily-analysis/YYYY-MM-DD/` and `daily-analysis/articles/`. Public image URLs are written into article JSON (`vnindexImage` / `goldImage`). Committed JSON in `content/daily-analysis/` is still read for backward compatibility; existing Vercel Blob URLs in old articles continue to work if those blobs remain reachable.

Create an R2 bucket in the Cloudflare dashboard, enable a public bucket URL or custom domain, and set `R2_PUBLIC_URL` accordingly.
