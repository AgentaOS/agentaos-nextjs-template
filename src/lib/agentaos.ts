import "server-only";

import { AgentaOS } from "@agentaos/pay";

import { requireEnv } from "./env";

let client: AgentaOS | undefined;

/**
 * The server-side AgentaOS client. Created on first use, so `next build`
 * works before the API key is set.
 */
export function getAgentaOS(): AgentaOS {
  client ??= new AgentaOS(requireEnv("AGENTAOS_API_KEY"));
  return client;
}

/** A sk_live_ key means live mode; a sk_test_ key means test mode. */
export function isLiveMode(): boolean {
  return requireEnv("AGENTAOS_API_KEY").startsWith("sk_live_");
}
