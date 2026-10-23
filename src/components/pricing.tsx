import { getPrice, type Price } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { PRODUCTS, productLinkId, type Product } from "@/lib/products";

export function Pricing() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PRODUCTS.map((product) => (
        <PricingCard key={product.slug} product={product} />
      ))}
    </div>
  );
}

async function PricingCard({ product }: { product: Product }) {
  const linkId = productLinkId(product);
  const price = linkId ? await getPrice(linkId) : null;

  return (
    <div
      className={`flex flex-col rounded-xl border p-6 ${
        product.highlighted ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        {product.highlighted && (
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            Popular
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{product.description}</p>
      <PriceLabel price={price} kind={product.kind} />
      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {product.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span aria-hidden className="text-accent">
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
      <form action="/api/checkout" method="post" className="mt-8">
        <input type="hidden" name="product" value={product.slug} />
        <button
          type="submit"
          disabled={!linkId}
          className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            product.highlighted
              ? "bg-accent text-white hover:bg-accent-hover"
              : "border border-border hover:bg-surface"
          }`}
        >
          {product.kind === "subscription" ? `Subscribe to ${product.name}` : `Buy ${product.name}`}
        </button>
      </form>
      {!linkId && (
        <p className="mt-2 text-xs text-muted">
          Set <code className="font-mono">{product.linkIdEnv}</code> to sell this.
        </p>
      )}
    </div>
  );
}

function PriceLabel({ price, kind }: { price: Price | null; kind: Product["kind"] }) {
  if (!price) {
    return <p className="mt-6 text-3xl font-semibold text-muted">--</p>;
  }
  const suffix = price.interval ? `/${price.interval}` : kind === "one_time" ? " once" : "";
  return (
    <p className="mt-6">
      <span className="text-4xl font-semibold tracking-tight">
        {formatMoney(price.amount, price.currency)}
      </span>
      <span className="text-sm text-muted">{suffix}</span>
    </p>
  );
}
