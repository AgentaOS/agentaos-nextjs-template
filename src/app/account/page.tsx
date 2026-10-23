import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CancelButton } from "@/components/cancel-button";
import { Notice } from "@/components/notice";
import { getUserPurchases, getUserSubscriptions, hasAccess } from "@/lib/billing";
import { formatDate } from "@/lib/format";
import { PRODUCTS, findProduct, findProductByLinkId } from "@/lib/products";
import { getCurrentUser } from "@/lib/session";

import { cancelSubscription } from "./actions";

const ONE_TIME_PRODUCTS = PRODUCTS.filter((p) => p.kind === "one_time").map((p) => p.slug);

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <div className="mt-6">
        <Suspense>
          <Notice />
        </Suspense>
      </div>
      <Suspense fallback={<p className="text-muted">Loading...</p>}>
        <AccountDetails />
      </Suspense>
    </div>
  );
}

async function AccountDetails() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/account");

  const [subscriptions, purchases] = await Promise.all([
    getUserSubscriptions(user.id),
    getUserPurchases(user.id, ONE_TIME_PRODUCTS),
  ]);

  return (
    <div className="space-y-10">
      <p className="text-muted">Signed in as {user.email}</p>

      <Section title="Subscription">
        {subscriptions.length === 0 ? (
          <Empty />
        ) : (
          subscriptions.map((sub) => <SubscriptionRow key={sub.id} sub={sub} />)
        )}
      </Section>

      <Section title="Purchases">
        {purchases.length === 0 ? (
          <p className="text-sm text-muted">No one-time purchases yet.</p>
        ) : (
          purchases.map((p) => (
            <div key={p.sessionId} className="flex justify-between text-sm">
              <span className="font-medium">{findProduct(p.product)?.name ?? p.product}</span>
              <span className="text-muted">{formatDate(p.completedAt?.toISOString() ?? null)}</span>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

type SubscriptionRowData = Awaited<ReturnType<typeof getUserSubscriptions>>[number];

function SubscriptionRow({ sub }: { sub: SubscriptionRowData }) {
  const name = findProductByLinkId(sub.linkId)?.name ?? sub.planName ?? "Your plan";
  const periodEnd = formatDate(sub.currentPeriodEnd);
  const canCancel = hasAccess(sub.status) && !sub.cancelAtPeriodEnd;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-medium">
          {name} <StatusBadge status={sub.status} />
        </p>
        <p className="mt-1 text-sm text-muted">
          {sub.cancelAtPeriodEnd
            ? `Canceled. Access ends ${periodEnd ?? "at the end of the period"}.`
            : periodEnd
              ? `Renews ${periodEnd}.`
              : "Waiting for the first billing update from AgentaOS."}
        </p>
      </div>
      {canCancel && (
        <form action={cancelSubscription}>
          <input type="hidden" name="subscriptionId" value={sub.id} />
          <CancelButton />
        </form>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const ok = hasAccess(status);
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 align-middle text-xs font-medium ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-surface text-muted"
      }`}
    >
      {status ?? "pending"}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="space-y-4 rounded-xl border border-border p-5">{children}</div>
    </section>
  );
}

function Empty() {
  return (
    <p className="text-sm text-muted">
      No plan yet.{" "}
      <Link href="/#pricing" className="text-accent hover:underline">
        See pricing
      </Link>
    </p>
  );
}
