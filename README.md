# AgentaOS Next.js Template

A Next.js starter that sells two subscription plans and a one-time product through [AgentaOS](https://agentaos.ai). Sign-up, checkout, webhooks and an account page with a cancel button are already wired up. Clone it, add your keys, and take your first test payment in about ten minutes.

AgentaOS is the merchant of record: it is the seller on every order, so it collects the payment by card or bank, works out and pays the sales tax and VAT, and sends the invoice. You get the payout.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAgentaOS%2Fagentaos-nextjs-template&env=APP_URL,BETTER_AUTH_SECRET,DATABASE_URL,DATABASE_AUTH_TOKEN,AGENTAOS_API_KEY,AGENTAOS_WEBHOOK_SECRET,AGENTAOS_LINK_STARTER,AGENTAOS_LINK_PRO,AGENTAOS_LINK_LIFETIME&envDescription=See%20.env.example&envLink=https%3A%2F%2Fgithub.com%2FAgentaOS%2Fagentaos-nextjs-template%2Fblob%2Fmain%2F.env.example&project-name=agentaos-nextjs-template&repository-name=agentaos-nextjs-template)

## What is inside

- **Pricing page** with two monthly plans (Starter, Pro) and one one-time product (Lifetime). Prices are read from AgentaOS, so you set them in one place.
- **Checkout route** (`POST /api/checkout`) that creates an AgentaOS checkout for the signed-in user and redirects to it.
- **Success page** (`/success`) that asks the API whether the checkout is paid and that it belongs to the signed-in user.
- **Account page** (`/account`) with the plan, its status, the renewal date, a cancel button and one-time purchases.
- **Webhook endpoint** (`POST /api/auth/agentaos/webhook`) that verifies the `x-agentaos-signature` header, skips events it has already handled, and updates the database.
- **Auth** by [Better Auth](https://better-auth.com) (email and password) with the [`@agentaos/better-auth`](https://docs.agentaos.ai/sdk/better-auth.md) plugin.
- **Database**: SQLite through [Drizzle](https://orm.drizzle.team) and libSQL. A local file in development, [Turso](https://turso.tech) in production.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4 and [`@agentaos/pay`](https://docs.agentaos.ai/sdk/pay-overview.md).

## Setup in 5 steps

You need Node.js 20.9 or newer and a free [AgentaOS account](https://app.agentaos.ai).

```bash
git clone https://github.com/AgentaOS/agentaos-nextjs-template.git
cd agentaos-nextjs-template
npm install
cp .env.example .env.local
```

### 1. Create a test API key

In the [dashboard](https://app.agentaos.ai), switch to **Test**, open **Developers > API keys** and click **Generate Test Key**. Put it in `AGENTAOS_API_KEY`. A `sk_test_` key runs everything in test mode; no real money moves.

Also set `BETTER_AUTH_SECRET` to a random string: `openssl rand -base64 32`.

### 2. Create your products

Create two monthly subscription plans and one one-time product, then copy each product's link ID (a UUID) into `.env.local`.

**In the dashboard:** open **Products > New product**, set the name and price, and choose one-time or subscription. On the product page, open **Building this into your site?** and click **Copy ID**.

**Or with the `agenta` CLI:**

```bash
npm install -g agentaos@latest
agenta login

agenta products create --name "Starter" -a 9 -c EUR --subscription --interval month --json
agenta products create --name "Pro" -a 29 -c EUR --subscription --interval month --json
agenta products create --name "Lifetime" -a 199 -c EUR --json
```

The `id` in each response is the link ID.

```bash
AGENTAOS_LINK_STARTER=...
AGENTAOS_LINK_PRO=...
AGENTAOS_LINK_LIFETIME=...
```

To sell different things, edit `src/lib/products.ts`.

### 3. Start a tunnel and set `APP_URL`

AgentaOS sends buyers back only to an `https` address, and it does not deliver webhooks to `localhost`. Give port 3000 a public HTTPS address with a tunnel, for example [ngrok](https://ngrok.com/docs/getting-started/) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/):

```bash
ngrok http 3000
# or: cloudflared tunnel --url http://localhost:3000
```

Set `APP_URL` to the tunnel URL, for example `APP_URL=https://abc123.ngrok-free.app`. Open the app at this URL, not at `localhost`, so you stay signed in when the checkout sends you back.

### 4. Add the webhook URL

In the dashboard, open **Settings > Developers > Webhooks** and set the URL to:

```
https://abc123.ngrok-free.app/api/auth/agentaos/webhook
```

Click **Reveal signing secret** and put it in `AGENTAOS_WEBHOOK_SECRET`. **Send test event** should answer `200`.

### 5. Create the database and run

```bash
npm run db:push
npm run dev
```

Open your tunnel URL, create an account, pick a plan and pay with the test card `4242 4242 4242 4242`, any future date and any CVC. You land on `/success`, and `/account` shows your plan with a **Cancel plan** button.

## How it works

```
Pricing card  ->  POST /api/checkout  ->  AgentaOS checkout  ->  /success?sessionId=...
                        |                                              |
                 purchase row (open)                        checkouts.retrieve()
                                                                       |
AgentaOS  ->  POST /api/auth/agentaos/webhook  ->  purchase completed, subscription saved
```

1. `POST /api/checkout` calls the plugin's checkout endpoint. It creates the checkout from the product's link ID, fills in the buyer's email and puts the user's ID in the checkout `metadata`. The app saves the session ID with the product, so it knows what was bought.
2. The buyer pays on the AgentaOS checkout and comes back to `/success?sessionId=...`. The page reads the checkout with `checkouts.retrieve()` and only trusts it when `status` is `completed` and `metadata.userId` is the signed-in user.
3. AgentaOS sends `checkout.session.completed` and the `subscription.*` events to the webhook. The plugin verifies the signature; `src/lib/webhooks.ts` skips repeated events by their ID and updates the database. The success page and the webhook do the same work and either can arrive first, so access is granted even if the buyer closes the tab.
4. Renewals send `checkout.session.completed` and `subscription.renewed`. Plan changes, cancellations and failed payments send `subscription.updated`, `subscription.canceled` and `subscription.payment_failed`. Each one updates the subscription row.
5. AgentaOS has no hosted customer portal. The **Cancel plan** button calls `subscriptions.cancel()`, which ends the plan at the end of the paid period.

### Files

| File | What it does |
| - | - |
| `src/lib/products.ts` | The products you sell and the env var that holds each link ID |
| `src/lib/auth.ts` | Better Auth with the AgentaOS plugin |
| `src/app/api/checkout/route.ts` | Starts a checkout and redirects to it |
| `src/app/success/page.tsx` | Confirms the checkout with the API |
| `src/lib/webhooks.ts` | Handles verified webhook events, once each |
| `src/lib/billing.ts` | Database writes for purchases and subscriptions, and cancel |
| `src/app/account/page.tsx` | Plan, status, cancel button and purchases |
| `src/db/schema.ts` | Auth tables, purchases, subscriptions, handled webhook events |

To gate a feature, read the user's subscription with `getUserSubscriptions(userId)` and check `hasAccess(sub.status)`.

## Deploy to Vercel

1. Create a [Turso](https://turso.tech) database and copy its URL (`libsql://...`) and token.
2. Create the tables: `DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:push`.
3. Click **Deploy with Vercel** above and fill in the env vars. Set `APP_URL` to your production URL.
4. In the AgentaOS dashboard, set the webhook URL to `https://your-domain.com/api/auth/agentaos/webhook`.

When you are ready for real payments, verify your business, create the products again in live mode, and swap in a `sk_live_` key, the live link IDs and the live webhook secret. See [Go live](https://docs.agentaos.ai/guides/go-live.md).

## Scripts

| Command | What it does |
| - | - |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm run db:push` | Create or update the database tables |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Docs

- [Quickstart](https://docs.agentaos.ai/getting-started/quickstart.md)
- [Test mode and test cards](https://docs.agentaos.ai/getting-started/test-mode.md)
- [Checkouts](https://docs.agentaos.ai/sdk/pay-checkouts.md)
- [Payment links (products)](https://docs.agentaos.ai/sdk/pay-payment-links.md)
- [Subscriptions](https://docs.agentaos.ai/sdk/pay-subscriptions.md)
- [Webhooks](https://docs.agentaos.ai/sdk/pay-webhooks.md) and [webhook events](https://docs.agentaos.ai/webhooks/events.md)
- [Better Auth plugin](https://docs.agentaos.ai/sdk/better-auth.md)
- [Embedded checkout](https://docs.agentaos.ai/payments/embedded-checkout.md)
- [Full docs index for AI assistants](https://docs.agentaos.ai/llms.txt)

## Contributing

Issues and pull requests are welcome. If you need a flow this template does not cover yet, open an issue.

## License

[MIT](LICENSE)
