"use client";

import { useFormStatus } from "react-dom";

export function CancelButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!confirm("Cancel your plan? You keep access until the end of the paid period.")) {
          event.preventDefault();
        }
      }}
      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface disabled:opacity-60"
    >
      {pending ? "Canceling..." : "Cancel plan"}
    </button>
  );
}
