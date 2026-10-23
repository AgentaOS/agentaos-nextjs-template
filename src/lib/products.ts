/**
 * What this app sells. Each product is a payment link in AgentaOS: create it in
 * the dashboard (or with the `agenta` CLI) and put its link ID in the env var
 * named by `linkIdEnv`. The price shown on the pricing page is read from
 * AgentaOS, so it is set in one place only.
 */
export type ProductSlug = "starter" | "pro" | "lifetime";

export interface Product {
  slug: ProductSlug;
  name: string;
  description: string;
  kind: "subscription" | "one_time";
  features: string[];
  linkIdEnv: string;
  highlighted?: boolean;
}

export const PRODUCTS: readonly Product[] = [
  {
    slug: "starter",
    name: "Starter",
    description: "For side projects and first customers.",
    kind: "subscription",
    features: ["1 project", "Email support", "Cancel anytime"],
    linkIdEnv: "AGENTAOS_LINK_STARTER",
  },
  {
    slug: "pro",
    name: "Pro",
    description: "For products with paying users.",
    kind: "subscription",
    features: ["Unlimited projects", "Priority support", "Cancel anytime"],
    linkIdEnv: "AGENTAOS_LINK_PRO",
    highlighted: true,
  },
  {
    slug: "lifetime",
    name: "Lifetime",
    description: "Pay once, keep it forever.",
    kind: "one_time",
    features: ["Everything in Pro", "All future updates", "No renewals"],
    linkIdEnv: "AGENTAOS_LINK_LIFETIME",
  },
];

export function findProduct(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.slug === slug);
}

/** The product's payment link ID, or undefined when its env var is not set. */
export function productLinkId(product: Product): string | undefined {
  return process.env[product.linkIdEnv] || undefined;
}

export function findProductByLinkId(linkId: string | null): Product | undefined {
  if (!linkId) return undefined;
  return PRODUCTS.find((product) => productLinkId(product) === linkId);
}
