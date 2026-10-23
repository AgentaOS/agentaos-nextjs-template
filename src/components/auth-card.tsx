import { Suspense } from "react";

import { AuthForm } from "./auth-form";

export function AuthCard({ mode, title }: { mode: "sign-in" | "sign-up"; title: string }) {
  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">{title}</h1>
      <Suspense>
        <AuthForm mode={mode} />
      </Suspense>
    </div>
  );
}
