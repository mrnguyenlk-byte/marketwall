"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Building2,
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/daily-analysis", label: "Daily Analysis", icon: FileText },
  { href: "/admin/brokers", label: "Brokers", icon: Building2 },
  { href: "/admin/site-settings", label: "Site Settings", icon: Settings },
  { href: "/admin/contact", label: "Contact", icon: Mail },
  { href: "/admin/automation-logs", label: "Automation Logs", icon: Activity },
] as const

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border/80 bg-card/40">
      <div className="border-b border-border/80 px-4 py-4">
        <Link href="/admin" className="text-sm font-semibold text-foreground">
          BTrading Admin
        </Link>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Internal CMS</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const { href, label, icon: Icon } = item
          const exact = "exact" in item && item.exact === true
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border/80 p-3">
        <Link
          href="/"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  )
}
