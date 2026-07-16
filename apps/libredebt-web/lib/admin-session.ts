/**
 * lib/admin-session.ts
 *
 * THE SINGLE CHOKEPOINT for superadmin access.
 *
 * Every admin page and every admin Server Action must call
 * requireSuperAdmin() — nowhere else in the codebase should query
 * isSuperAdmin directly. This mirrors the requireUser()/requireSession()
 * pattern from lib/auth-session.ts, but with a stricter failure mode.
 *
 * WHY notFound() INSTEAD OF redirect("/login")?
 * Redirecting to login reveals that a protected route exists at this
 * path. Returning a 404 makes the admin area indistinguishable from a
 * route that simply doesn't exist. This is a deliberate obscurity layer
 * ON TOP OF the real access control (the database check) — not a
 * replacement for it.
 *
 * isSuperAdmin IS NEVER READ FROM THE SESSION OBJECT.
 * It is not a BetterAuth additionalField, specifically so there's no
 * client-readable path to this flag. We do a direct, fresh database
 * read every time.
 */

import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth-session";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Verifies the current session belongs to a superadmin.
 * Calls notFound() — not redirect — for any non-admin, including
 * unauthenticated visitors and regular authenticated users.
 *
 * Use this as the FIRST line of every admin page and admin Server Action.
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const user = await requireUser();

  if (!user) {
    redirect("/login"); // ✅ ONLY place redirect happens
  }

  const rows = await db
    .select({ isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const isSuperAdmin = rows[0]?.isSuperAdmin ?? false;

  if (!isSuperAdmin) {
    notFound();
  }

  return { id: user.id, name: user.name, email: user.email };
}
