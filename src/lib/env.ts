import "server-only";

/** Reads a required environment variable, failing with a message that says how to fix it. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and set it.`);
  }
  return value;
}

/** The public HTTPS address of this app, without a trailing slash. */
export function appUrl(): string {
  return requireEnv("APP_URL").replace(/\/+$/, "");
}
