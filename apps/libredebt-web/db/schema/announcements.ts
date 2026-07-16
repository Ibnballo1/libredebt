// db/schema/announcements.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown or Plain Text support
  targetGroup: text("target_group").notNull(), // "all" | "pro" | "free" | "no-debts" | "individual"
  targetEmail: text("target_email"), // Only populated if targetGroup is "individual"
  targetName: text("target_name"), // Only populated if targetGroup is "individual"
  sentBy: text("sent_by").notNull(), // Admin User ID
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Announcement = typeof announcements.$inferSelect;
