"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"

import { Button, buttonVariants } from "@/components/ui/button"
import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function AuthButtons() {
  const { t } = useLang()
  const { data: session, status } = useSession()

  if (status === "loading") {
    return null
  }

  if (session?.user) {
    const label = session.user.name ?? session.user.email ?? t("action.login")

    return (
      <div className="hidden items-center gap-2 sm:flex">
        <span className="max-w-[140px] truncate text-sm text-muted-foreground" title={label}>
          {label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          {t("action.logout")}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "hidden text-foreground sm:inline-flex",
        )}
      >
        {t("action.login")}
      </Link>
      <Link
        href="/register"
        className={cn(
          buttonVariants({ size: "sm" }),
          "hidden bg-primary font-semibold text-white sm:inline-flex",
        )}
      >
        {t("action.register")}
      </Link>
    </>
  )
}
