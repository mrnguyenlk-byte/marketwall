import { AdminSidebar } from "@/components/admin/sidebar"
import { requireAdmin } from "@/lib/admin/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
