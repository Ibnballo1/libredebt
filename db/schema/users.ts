import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
  char,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { subscriptionTierEnum } from "./enums";

// ─── BETTERAUTH GENERATED CORES ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  /**
   * NOTE: Custom fields generated via BetterAuth plugins can safely remain
   * here to maintain plugin alignment, but your core feature gating logic
   * will still treat 'user_profiles' as the extended source of truth.
   */
  subscriptionTier: text("subscription_tier").default("free"),
  currency: text("currency").default("NGN"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  reminderDueSoonEnabled: boolean("reminder_due_soon_enabled")
    .notNull()
    .default(true),
  reminderOverdueEnabled: boolean("reminder_overdue_enabled")
    .notNull()
    .default(true),
  reminderWeeklySummaryEnabled: boolean("reminder_weekly_summary_enabled")
    .notNull()
    .default(true),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_userId_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("accounts_userId_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

// ─── LIBREDEBT APPLICATION EXTENSION ─────────────────────────────────────────
export const userProfiles = pgTable("user_profiles", {
  /**
   * Linked Primary Key. Enforces 1:1 integrity with BetterAuth users table.
   * Cascade delete ensures profiles drop if a user requests account deletion.
   */
  id: text("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  subscriptionTier: subscriptionTierEnum("subscription_tier")
    .notNull()
    .default("free"),

  /**
   * Hardened display currency constraint to exact ISO-3 characters.
   */
  currency: char("currency", { length: 3 }).notNull().default("NGN"),

  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── DRIZZLE APPMAP RELATIONS ────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.id],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
