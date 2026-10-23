import Link from "next/link";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/session";

import { SignOutButton } from "./sign-out-button";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Acme
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/#pricing" className="text-muted hover:text-foreground">
            Pricing
          </Link>
          <Suspense fallback={<span className="w-16" />}>
            <UserNav />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <Link href="/sign-in" className="text-muted hover:text-foreground">
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md bg-foreground px-3 py-1.5 font-medium text-white hover:opacity-90"
        >
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/account" className="text-muted hover:text-foreground">
        Account
      </Link>
      <SignOutButton />
    </>
  );
}
