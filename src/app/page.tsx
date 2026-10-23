import { Suspense } from "react";

import { Notice } from "@/components/notice";
import { Pricing } from "@/components/pricing";

const STEPS = [
  {
    title: "Sign up",
    body: "Email and password with Better Auth. Your user ID rides along on every checkout.",
  },
  {
    title: "Pay on AgentaOS",
    body: "A hosted checkout for card and bank. AgentaOS is the seller, so it handles tax and invoices.",
  },
  {
    title: "Get access",
    body: "A signed webhook updates your database. The account page shows the plan and a cancel button.",
  },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 pt-20 pb-16 text-center sm:px-6">
        <p className="text-sm font-medium text-accent">Next.js + Better Auth + AgentaOS</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
          Start charging this afternoon.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Two subscription plans and a one-time product, wired to checkout, webhooks and an
          account page. Sell to buyers worldwide, with tax and invoices handled for you.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a
            href="#pricing"
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            See pricing
          </a>
          <a
            href="https://docs.agentaos.ai"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
          >
            Read the docs
          </a>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <ol className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="font-mono text-sm text-accent">0{index + 1}</span>
              <h2 className="mt-2 font-semibold">{step.title}</h2>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="mx-auto max-w-5xl scroll-mt-8 px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Pricing</h2>
          <p className="mt-2 text-muted">
            In test mode, pay with the card 4242 4242 4242 4242, any future date and any CVC.
          </p>
        </div>
        <Suspense>
          <Notice />
        </Suspense>
        <Pricing />
      </section>
    </>
  );
}
