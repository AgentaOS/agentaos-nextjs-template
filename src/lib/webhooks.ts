import "server-only";

import type { WebhookEvent } from "@agentaos/pay";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { webhookEvent } from "@/db/schema";

import { isLiveMode } from "./agentaos";
import { completeCheckout, saveSubscriptionState } from "./billing";

/**
 * Handles every AgentaOS webhook event after the Better Auth plugin has
 * verified its x-agentaos-signature header. Throwing makes the endpoint
 * answer 500, so AgentaOS delivers the event again later.
 */
export async function handleAgentaOSEvent({ event }: { event: WebhookEvent }): Promise<void> {
  if (isTestEventInLiveMode(event)) return;

  const key = dedupeKey(event);
  if (key && !(await claimEvent(key, event.type))) return;

  try {
    await applyEvent(event);
  } catch (error) {
    if (key) await db.delete(webhookEvent).where(eq(webhookEvent.id, key));
    throw error;
  }
}

async function applyEvent(event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const { subscriptionId } = event.data.metadata;
      await completeCheckout({
        sessionId: event.data.sessionId,
        subscriptionId: typeof subscriptionId === "string" ? subscriptionId : null,
      });
      return;
    }
    case "subscription.created":
    case "subscription.renewed":
    case "subscription.updated":
    case "subscription.payment_failed":
    case "subscription.canceled":
      await saveSubscriptionState(event.data);
      return;
    default:
      return;
  }
}

/**
 * The event's own ID, which stays the same across redeliveries. The SDK type
 * does not declare `id` yet, so it is read from the parsed body. Falls back to
 * the per-type keys from https://docs.agentaos.ai/webhooks/events.md#deduplication.
 */
function dedupeKey(event: WebhookEvent): string | null {
  const id = (event as { id?: unknown }).id;
  if (typeof id === "string" && id) return id;

  switch (event.type) {
    case "checkout.session.completed":
      return `${event.type}:${event.data.sessionId}`;
    case "subscription.created":
    case "subscription.renewed":
    case "subscription.payment_failed":
    case "subscription.canceled":
      return `${event.type}:${event.data.id}:${event.data.currentPeriodEnd ?? ""}`;
    default:
      return null;
  }
}

/** Records the event as handled. Returns false when it was handled before. */
async function claimEvent(id: string, type: string): Promise<boolean> {
  const inserted = await db
    .insert(webhookEvent)
    .values({ id, type })
    .onConflictDoNothing()
    .returning({ id: webhookEvent.id });
  return inserted.length > 0;
}

function isTestEventInLiveMode(event: WebhookEvent): boolean {
  const { livemode } = event.data as { livemode?: boolean };
  return isLiveMode() && livemode === false;
}
