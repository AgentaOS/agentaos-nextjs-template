import "server-only";

import { cacheLife } from "next/cache";

import { getAgentaOS } from "./agentaos";

export interface Price {
  amount: number;
  currency: string;
  interval: "month" | "year" | null;
}

/**
 * Reads a product's price from its AgentaOS payment link. Cached for a few
 * minutes so the pricing page does not call the API on every visit. Returns
 * null when AgentaOS is not configured yet or the link does not exist.
 */
export async function getPrice(linkId: string): Promise<Price | null> {
  "use cache";
  cacheLife("minutes");

  try {
    const link = await getAgentaOS().paymentLinks.retrieve(linkId);
    return { amount: link.amount, currency: link.currency, interval: link.billingInterval };
  } catch {
    return null;
  }
}
