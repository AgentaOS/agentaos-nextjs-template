import "server-only";

import type { Subscription, SubscriptionData } from "@agentaos/pay";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { purchase, subscription } from "@/db/schema";

import { getAgentaOS } from "./agentaos";
import type { ProductSlug } from "./products";

/** Statuses that give the user access to a plan. */
const ACCESS_STATUSES = ["active", "trialing", "past_due"];

export function hasAccess(status: string | null): boolean {
  return status !== null && ACCESS_STATUSES.includes(status);
}

export async function recordPendingCheckout(input: {
  sessionId: string;
  userId: string;
  product: ProductSlug;
}): Promise<void> {
  await db.insert(purchase).values(input).onConflictDoNothing();
}

/**
 * Marks a checkout as paid and links its subscription to the buyer. Safe to
 * call more than once for the same checkout: the success page and the webhook
 * both call it, in either order.
 */
export async function completeCheckout(input: {
  sessionId: string;
  subscriptionId: string | null;
}): Promise<void> {
  const [row] = await db
    .select()
    .from(purchase)
    .where(eq(purchase.sessionId, input.sessionId))
    .limit(1);

  // A renewal has its own session ID that this app never created. The
  // subscription.renewed event that comes with it updates the period.
  if (!row) return;

  if (row.status === "open") {
    await db
      .update(purchase)
      .set({ status: "completed", completedAt: new Date(), subscriptionId: input.subscriptionId })
      .where(and(eq(purchase.sessionId, input.sessionId), eq(purchase.status, "open")));
  }

  if (input.subscriptionId) {
    await db
      .insert(subscription)
      .values({ id: input.subscriptionId, userId: row.userId })
      .onConflictDoUpdate({ target: subscription.id, set: { userId: row.userId } });
  }
}

/** The fields this app keeps. Both `SubscriptionData` (webhooks) and `Subscription` (API) have them. */
type SubscriptionState = Pick<
  SubscriptionData | Subscription,
  "id" | "linkId" | "planName" | "status" | "currentPeriodEnd" | "cancelAtPeriodEnd"
>;

/** Stores the latest state of a subscription, from a webhook event or the API. */
export async function saveSubscriptionState(sub: SubscriptionState): Promise<void> {
  const state = {
    linkId: sub.linkId,
    planName: sub.planName,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  };
  await db
    .insert(subscription)
    .values({ id: sub.id, ...state })
    .onConflictDoUpdate({ target: subscription.id, set: state });
}

/**
 * Reads one subscription from AgentaOS and stores it. The API has no
 * retrieve-by-ID for subscriptions, so this pages through the list.
 * Used by the success page, so the account page is right even before
 * the first webhook arrives.
 */
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const agentaos = getAgentaOS();
  for (let offset = 0; ; offset += 100) {
    const page = await agentaos.subscriptions.list({ limit: 100, offset });
    const found = page.items.find((sub) => sub.id === subscriptionId);
    if (found) return saveSubscriptionState(found);
    if (!page.hasMore || page.items.length === 0) return;
  }
}

export async function getUserSubscriptions(userId: string) {
  return db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.updatedAt));
}

export async function getUserPurchases(userId: string, products: ProductSlug[]) {
  return db
    .select()
    .from(purchase)
    .where(
      and(
        eq(purchase.userId, userId),
        eq(purchase.status, "completed"),
        inArray(purchase.product, products),
      ),
    )
    .orderBy(desc(purchase.completedAt));
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subs = await getUserSubscriptions(userId);
  return subs.some((sub) => hasAccess(sub.status) && !sub.cancelAtPeriodEnd);
}

/**
 * Cancels a subscription at the end of the paid period. AgentaOS has no hosted
 * customer portal, so the app offers the cancel button itself.
 */
export async function cancelSubscriptionForUser(userId: string, subscriptionId: string) {
  const [owned] = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(and(eq(subscription.id, subscriptionId), eq(subscription.userId, userId)))
    .limit(1);
  if (!owned) throw new Error("Subscription not found");

  const result = await getAgentaOS().subscriptions.cancel(subscriptionId);
  await db
    .update(subscription)
    .set({
      status: result.status,
      currentPeriodEnd: result.currentPeriodEnd,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    })
    .where(eq(subscription.id, subscriptionId));
}
