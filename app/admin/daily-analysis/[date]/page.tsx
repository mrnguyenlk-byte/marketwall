import { notFound } from "next/navigation"

import { DailyAnalysisEditForm } from "@/components/admin/daily-analysis-edit-form"
import { getDailyAnalysisByDate } from "@/lib/daily-analysis/storage"

type Props = {
  params: Promise<{ date: string }>
}

export default async function AdminDailyAnalysisEditPage({ params }: Props) {
  const { date } = await params
  const article = await getDailyAnalysisByDate(date)
  if (!article) notFound()

  return <DailyAnalysisEditForm article={article} />
}
