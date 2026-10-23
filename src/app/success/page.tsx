import { NotFoundError, type Checkout } from "@agentaos/pay";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getAgentaOS } from "@/lib/agentaos";
import { completeCheckout, syncSubscription } from "@/lib/billing";
import { getCurrentUser } from "@/lib/session";

export default function SuccessPage({ searchParams }: PageProps<"/success">) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <Suspense fallback={<p className="text-muted">Checking your payment...</p>}>
        <CheckoutResult searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/**
 * AgentaOS sends the buyer here with ?sessionId=... after the checkout. Anyone
 * can open this URL, so the page asks the API for the checkout's status and
 * checks that it belongs to the signed-in user. The webhook does the same work,
 * so access is granted even if the buyer closes the tab before this page loads.
 */
async function CheckoutResult({ searchParams }: Pick<PageProps<"/success">, "searchParams">) {
  const { sessionId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const checkout = typeof sessionId === "string" ? await findCheckout(sessionId) : null;
  if (!checkout || checkout.metadata.userId !== user.id) {
    return <Result title="Checkout not found" body="We could not find this checkout on your account." />;
  }

  if (checkout.status === "completed") {
    const { subscriptionId } = checkout.metadata;
    const subId = typeof subscriptionId === "string" ? subscriptionId : null;
    await completeCheckout({ sessionId: checkout.sessionId, subscriptionId: subId });
    if (subId) await syncSubscription(subId);
    return <Result title="Payment confirmed" body="Thanks for your purchase. You now have access." />;
  }

  if (checkout.status === "open") {
    return (
      <Result
        title="Still processing"
        body="Your payment is on its way. This can take a few seconds."
        action={{ href: `/success?sessionId=${checkout.sessionId}`, label: "Refresh" }}
      />
    );
  }

  return (
    <Result
      title="Checkout closed"
      body="This checkout expired or was canceled. No money was taken."
      action={{ href: "/#pricing", label: "Back to pricing" }}
    />
  );
}

async function findCheckout(sessionId: string): Promise<Checkout | null> {
  try {
    return await getAgentaOS().checkouts.retrieve(sessionId);
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

function Result(props: { title: string; body: string; action?: { href: string; label: string } }) {
  const action = props.action ?? { href: "/account", label: "Go to your account" };
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{props.title}</h1>
      <p className="mt-3 text-muted">{props.body}</p>
      <Link
        href={action.href}
        className="mt-8 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
      >
        {action.label}
      </Link>
    </>
  );
}
