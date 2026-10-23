"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

/** Only follow same-site paths, so ?next= cannot send users to another site. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name: String(form.get("name")) })
        : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Try again.");
      setPending(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  const isSignUp = mode === "sign-up";
  const otherHref = `${isSignUp ? "/sign-in" : "/sign-up"}?next=${encodeURIComponent(next)}`;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isSignUp && <Field label="Name" name="name" type="text" autoComplete="name" />}
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        minLength={8}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "One moment..." : isSignUp ? "Create account" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        {isSignUp ? "Have an account? " : "New here? "}
        <Link href={otherHref} className="text-accent hover:underline">
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  minLength?: number;
}) {
  const { label, ...input } = props;
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        {...input}
        required
        className="mt-1 block w-full rounded-md border border-border px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
