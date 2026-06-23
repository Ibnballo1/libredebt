/**
 * app/(admin)/layout.tsx — Admin Shell
 *
 * Deliberately separate from app/(dashboard)/layout.tsx. requireSuperAdmin()
 * is called here, at the layout level, so every page under (admin) is
 * protected by definition — a developer adding a new admin page later
 * cannot forget the check.
 *
 * Visual design is intentionally distinct from the user dashboard:
 * deep slate background, amber accent instead of emerald, so there's
 * never visual confusion about which surface you're looking at.
 */

import { requireSuperAdmin } from "@/lib/admin-session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F17]">
      <AdminSidebar adminName={admin.name} adminEmail={admin.email} />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
