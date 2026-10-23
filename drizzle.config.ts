import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Read .env and .env.local the same way Next.js does.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
