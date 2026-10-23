"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { cancelSubscriptionForUser } from "@/lib/billing";
import { getCurrentUser } from "@/lib/session";

export async function cancelSubscription(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await cancelSubscriptionForUser(user.id, String(formData.get("subscriptionId") ?? ""));
  revalidatePath("/account");
}
