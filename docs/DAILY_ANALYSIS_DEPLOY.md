# Daily analysis automation — Vercel deployment

The `/api/automation/daily-analysis/run` endpoint uploads chart images and persists generated articles. On Vercel/serverless, the project filesystem is read-only — writes to `public/` or `content/` fail with `ENOENT`.

## Required environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DAILY_AUTOMATION_SECRET` | Vercel + local | Bearer secret for automation POST requests |
| `BLOB_READ_WRITE_TOKEN` | **Vercel (required)** | Vercel Blob storage for images and JSON articles |
| `OPENAI_API_KEY` | Vercel + local | OpenAI content generation (falls back to mock if unset) |

Optional:

- `DAILY_ANALYSIS_OPENAI_MODEL` — defaults to `gpt-4o-mini`

## Storage behavior

- **Local dev** (no `BLOB_READ_WRITE_TOKEN`): files under `public/uploads/daily-analysis/` and `content/daily-analysis/`.
- **Vercel production** (`BLOB_READ_WRITE_TOKEN` set): images and articles stored in Vercel Blob with public URLs (`*.blob.vercel-storage.com`). Committed JSON in `content/daily-analysis/` is still read for backward compatibility.

Create a Blob store in the Vercel project dashboard; the `BLOB_READ_WRITE_TOKEN` is injected automatically when linked.
