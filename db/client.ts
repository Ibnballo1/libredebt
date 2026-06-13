// import "server-only"; // Prevents this from ever leaking into client components
import postgres from "postgres";

// We will use standard env validation, but fall back to process.env safely if validation layer is booting
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("❌ DATABASE_URL environment variable is missing.");
}

// ─── SINGLETON PATTERN FOR DEV HMR ──────────────────────────────────────────
// Prevents Next.js hot-reloading from opening new connection pools on every save
declare global {
  // eslint-disable-next-line no-var
  var postgresClient: postgres.Sql | undefined;
}

export const queryClient =
  global.postgresClient ??
  postgres(databaseUrl, {
    prepare: false, // MANDATORY for Supabase PgBouncer transaction pooling
    // Serverless production gets 1 connection per instance; local dev gets up to 10 for speed
    max: process.env.NODE_ENV === "production" ? 1 : 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.postgresClient = queryClient;
}
