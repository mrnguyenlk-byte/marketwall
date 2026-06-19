/** Build a URL-safe slug from article title and date (YYYY-MM-DD). */
export function generateDailyAnalysisSlug(title: string, date: string): string {
  const fromTitle = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const base = fromTitle || "phan-tich-thi-truong"
  return `${base}-${date}`.replace(/-+/g, "-").replace(/^-+|-+$/g, "")
}
