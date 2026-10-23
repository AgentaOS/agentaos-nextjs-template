# Notes for coding agents

This is a Next.js 16 App Router app with Cache Components on. Next.js 16 differs from older versions: read the guides in `node_modules/next/dist/docs/` before changing routing, caching or data fetching. Pages that read the session or search params do it inside a `<Suspense>` boundary.

## Payments

- Payments go through `@agentaos/pay` (server only). Use only the methods in `node_modules/@agentaos/pay/dist/*.d.ts`. Docs index: https://docs.agentaos.ai/llms.txt
- A product is an AgentaOS payment link. Its UUID (`linkId`) lives in an `AGENTAOS_LINK_*` env var, listed in `src/lib/products.ts`.
- `checkout.session.completed` sends `linkId` as the link's public token, not its UUID. The app knows what was bought from the `purchase` row saved when the checkout started.
- The user's ID is in the checkout `metadata.userId`. Renewals do not carry it; match them by `metadata.subscriptionId`.
- Money: `amount` fields are decimal currency units; only fields ending in `Minor` are integer minor units.
- Never grant access from the success redirect alone: confirm with `checkouts.retrieve()` or the webhook.

## Commands

- `npm run typecheck`, `npm run lint`, `npm run build` must pass.
- `npm run db:push` applies `src/db/schema.ts` to the database.
