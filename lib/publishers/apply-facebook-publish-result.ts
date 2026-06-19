import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import type { FacebookPublishResult } from "@/lib/publishers/facebook"

/** Merge Facebook publish outcome into a daily analysis article record. */
export function applyFacebookPublishResult(
  article: DailyAnalysis,
  result: FacebookPublishResult,
): DailyAnalysis {
  const updated: DailyAnalysis = {
    ...article,
    updatedAt: new Date().toISOString(),
  }

  if (result.ok) {
    updated.facebookStatus = "sent"
    updated.facebookPostId = result.postId
    updated.facebookError = undefined
    updated.facebookErrorCode = undefined
    return updated
  }

  if (result.error.startsWith("skipped:")) {
    updated.facebookStatus = "skipped"
    updated.facebookError = undefined
    updated.facebookErrorCode = undefined
    return updated
  }

  updated.facebookStatus = "failed"
  updated.facebookError = result.error
  updated.facebookErrorCode =
    result.errorCode != null ? String(result.errorCode) : undefined
  return updated
}

import type { Prisma } from "@/lib/generated/prisma/client"

export type FacebookAutomationLogFields = {
  facebookStatus: string | null
  facebookError: string | null
  facebookErrorCode: string | null
  errors?: Prisma.InputJsonValue
}

export function facebookResultToAutomationLog(
  saved: DailyAnalysis,
  result: FacebookPublishResult,
): FacebookAutomationLogFields {
  const base = {
    facebookStatus: saved.facebookStatus ?? null,
    facebookError: saved.facebookError ?? null,
    facebookErrorCode: saved.facebookErrorCode ?? null,
  }

  if (result.ok) return base

  return {
    ...base,
    errors: {
      error: result.error,
      ...(result.errorCode != null ? { errorCode: String(result.errorCode) } : {}),
      ...(result.errorResponse != null
        ? { errorResponse: JSON.parse(JSON.stringify(result.errorResponse)) as Prisma.InputJsonValue }
        : {}),
    },
  }
}
