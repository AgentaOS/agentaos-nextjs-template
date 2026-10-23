import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull();

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull();

// Better Auth tables (https://www.better-auth.com/docs/concepts/database).

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// Billing tables.

/** One row per checkout this app starts. The session ID is the AgentaOS checkout's public ID. */
export const purchase = sqliteTable(
  "purchase",
  {
    sessionId: text("session_id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The product slug from src/lib/products.ts. */
    product: text("product").notNull(),
    status: text("status", { enum: ["open", "completed"] }).default("open").notNull(),
    /** Set when the product is a subscription plan. */
    subscriptionId: text("subscription_id"),
    createdAt: createdAt(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("purchase_user_id_idx").on(table.userId)],
);

/**
 * The latest known state of each AgentaOS subscription, kept current by webhooks.
 * `userId` is null until the checkout that started it is matched to a user,
 * because `subscription.created` can arrive before `checkout.session.completed`.
 */
export const subscription = sqliteTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    /** The plan's payment link ID (UUID), the value in AGENTAOS_LINK_*. */
    linkId: text("link_id"),
    planName: text("plan_name"),
    status: text("status"),
    currentPeriodEnd: text("current_period_end"),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).default(false).notNull(),
    updatedAt: updatedAt(),
  },
  (table) => [index("subscription_user_id_idx").on(table.userId)],
);

/** Webhook events already handled, so a redelivered event is skipped. */
export const webhookEvent = sqliteTable("webhook_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: createdAt(),
});
