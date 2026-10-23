import "server-only";

import { headers } from "next/headers";

import { getAuth } from "./auth";

export async function getCurrentUser() {
  // Read the request first: it marks the caller as dynamic, so nothing below
  // runs while Next.js prerenders the static shell.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session?.user ?? null;
}
