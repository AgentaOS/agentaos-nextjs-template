import "server-only";

import { agentaos } from "@agentaos/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db, schema } from "@/db";

import { getAgentaOS } from "./agentaos";
import { appUrl, requireEnv } from "./env";
import { PRODUCTS, productLinkId } from "./products";
import { handleAgentaOSEvent } from "./webhooks";

function configuredProducts() {
  return PRODUCTS.flatMap((product) => {
    const productId = productLinkId(product);
    return productId ? [{ slug: product.slug, productId }] : [];
  });
}

function createAuth() {
  const baseURL = appUrl();

  return betterAuth({
    baseURL,
    secret: requireEnv("BETTER_AUTH_SECRET"),
    trustedOrigins: [baseURL, "http://localhost:3000"],
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: { enabled: true },
    plugins: [
      // Adds POST /api/auth/agentaos/checkout and POST /api/auth/agentaos/webhook.
      agentaos({
        client: getAgentaOS(),
        products: configuredProducts(),
        // AgentaOS appends ?sessionId=... when it sends the buyer back.
        successUrl: `${baseURL}/success`,
        cancelUrl: `${baseURL}/#pricing`,
        webhookSecret: process.env.AGENTAOS_WEBHOOK_SECRET,
        onEvent: handleAgentaOSEvent,
      }),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

let auth: Auth | undefined;

/** The Better Auth server. Created on first use, so `next build` works before env vars are set. */
export function getAuth(): Auth {
  auth ??= createAuth();
  return auth;
}
