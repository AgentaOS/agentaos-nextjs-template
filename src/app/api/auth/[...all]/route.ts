import { getAuth } from "@/lib/auth";

// Better Auth: sign up, sign in, sessions, and the AgentaOS plugin endpoints,
// including the webhook at POST /api/auth/agentaos/webhook.
export function GET(request: Request) {
  return getAuth().handler(request);
}

export function POST(request: Request) {
  return getAuth().handler(request);
}
