"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  unknown_product: "That product does not exist.",
  product_not_configured: "That product has no AgentaOS link ID yet. Check your env vars.",
  checkout_failed: "The checkout could not be started. Check the server logs.",
  already_subscribed: "You already have an active plan. Cancel it before choosing another.",
};

/** Shows a short message for the ?error= or ?notice= query parameter. */
export function Notice() {
  const params = useSearchParams();
  const code = params.get("error") ?? params.get("notice");
  const message = code ? MESSAGES[code] : undefined;
  if (!message) return null;

  return (
    <p role="status" className="mb-6 rounded-md border border-border bg-surface px-4 py-3 text-sm">
      {message}
    </p>
  );
}
