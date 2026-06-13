// import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { queryClient } from "./client";
import * as schema from "./schema/index";

/**
 * Drizzle ORM Instance configured for LibreDebt.
 * logger: true prints out all running SQL strings directly in your terminal during dev mode.
 */
export const db = drizzle(queryClient, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

// ─── FINTECH TRANSACTION EXPORTS ───────────────────────────────────────────
// This enables us to pass a generic transaction client ('tx') into our
// ledger repositories, ensuring multiple inserts succeed or fail together.
export type DbClient = typeof db;
export type TxClient = Parameters<Parameters<DbClient["transaction"]>[0]>[0];

export { schema };

/**
 * Database health check helper.
 * Used during app boot setups or monitoring endpoints to verify DB connection availability.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("Database connection check failed:", error);
    return false;
  }
}
