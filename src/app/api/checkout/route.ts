import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";
import { hasActiveSubscription, recordPendingCheckout } from "@/lib/billing";
import { findProduct, productLinkId } from "@/lib/products";

/**
 * POST /api/checkout with a `product` form field. Creates an AgentaOS checkout
 * for the signed-in user and redirects the browser to it.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const product = findProduct(String(form.get("product") ?? ""));
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);

  if (!product) return redirectTo("/?error=unknown_product#pricing");
  if (!productLinkId(product)) return redirectTo("/?error=product_not_configured#pricing");

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return redirectTo("/sign-up?next=/%23pricing");

  if (product.kind === "subscription" && (await hasActiveSubscription(session.user.id))) {
    return redirectTo("/account?notice=already_subscribed");
  }

  try {
    // The plugin fills in the buyer's email and puts their user ID in the
    // checkout metadata, so the webhook knows who paid.
    const checkout = await auth.api.agentaosCheckout({
      body: { slug: product.slug },
      headers: request.headers,
    });
    await recordPendingCheckout({
      sessionId: checkout.sessionId,
      userId: session.user.id,
      product: product.slug,
    });
    return NextResponse.redirect(checkout.url, 303);
  } catch (error) {
    console.error("AgentaOS checkout failed", error);
    return redirectTo("/?error=checkout_failed#pricing");
  }
}
