"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { toActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { businessProfileSchema } from "@/lib/validation";
import type { ActionState } from "@/actions/auth";
import { ACTIVITY_CATEGORIES } from "@/domain/activity";

export async function updateBusinessProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const activityCategories = ACTIVITY_CATEGORIES.filter((category) => formData.get(`activity_${category}`) === "on");
    const input = businessProfileSchema.parse({
      businessName: formData.get("businessName"),
      ownerName: formData.get("ownerName"),
      siret: formData.get("siret"),
      siren: formData.get("siren"),
      address: formData.get("address"),
      postalCode: formData.get("postalCode"),
      city: formData.get("city"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      mainActivityCategory: formData.get("mainActivityCategory"),
      activityCategories,
      mixedActivityEnabled: formData.get("mixedActivityEnabled") === "on",
      declarationFrequency: formData.get("declarationFrequency"),
      vatStatus: formData.get("vatStatus"),
      taxWithholdingEnabled: formData.get("taxWithholdingEnabled") === "on",
      contributionRulesYear: formData.get("contributionRulesYear"),
      conservativeReserveBufferRate: formData.get("conservativeReserveBufferRate") || "0.05",
      reminderEmailEnabled: formData.get("reminderEmailEnabled") === "on",
      documentFooterText: formData.get("documentFooterText"),
      defaultSignature: formData.get("defaultSignature"),
    });
    await prisma.businessProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...input },
      update: input,
    });
    revalidatePath("/app/settings");
    revalidatePath("/app");
    return { ok: true, message: "Profil enregistré." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveBusinessProfileAndRedirect(_state: ActionState, formData: FormData): Promise<ActionState> {
  const result = await updateBusinessProfileAction(_state, formData);
  if (!result.error) redirect("/app/settings");
  return result;
}
