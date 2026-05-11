"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "@/domain/auth/passwords";
import { destroySession, requireUser } from "@/lib/auth";
import { ValidationError, toActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { accountSchema, changePasswordSchema } from "@/lib/validation";
import type { ActionState } from "@/actions/auth";

export async function updateAccountAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const input = accountSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
    });
    const emailChanged = input.email !== user.email;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        email: input.email,
        emailVerifiedAt: emailChanged ? null : user.emailVerifiedAt,
      },
    });
    revalidatePath("/app/account");
    return {
      ok: true,
      message: emailChanged
        ? "Compte mis à jour. Votre nouvel email doit être vérifié."
        : "Compte mis à jour.",
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function changePasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const input = changePasswordSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
    });
    const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!freshUser || !(await verifyPassword(input.currentPassword, freshUser.passwordHash))) {
      throw new ValidationError("Mot de passe actuel invalide.");
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.newPassword) },
    });
    return { ok: true, message: "Mot de passe mis à jour." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "SUPPRIMER") {
    redirect("/app/account?notice=Confirmation%20invalide.");
  }
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
