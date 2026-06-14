/**

 * app/page.tsx — Root Route

 *

 * The root "/" route.

 * Authenticated users land here after typing the domain directly.

 *

 * We redirect immediately:

 *   - Authenticated → /overview (middleware handles this for dashboard routes,

 *     but the root "/" isn't a protected route, so we handle it here)

 *   - Unauthenticated → /login

 *

 * In a future marketing stage, this would render the landing page.

 * For now, LibreDebt goes straight to the app.

 */

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth-session";

export default async function RootPage() {
  const session = await getSession();

  if (session) {
    redirect("/overview");
  } else {
    redirect("/login");
  }
}
