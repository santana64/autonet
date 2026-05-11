"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { NotFoundError, toActionError } from "@/lib/errors";
import { enforceClientLimit } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validation";
import type { ActionState } from "@/actions/auth";

export async function createClientAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let redirectTo: string | null = null;
  try {
    const user = await requireUser();
    await enforceClientLimit(user.id);
    const input = clientSchema.parse({
      name: formData.get("name"),
      companyName: formData.get("companyName"),
      email: formData.get("email"),
      notes: formData.get("notes"),
    });
    await prisma.client.create({ data: { userId: user.id, ...input } });
    redirectTo = "/app/clients";
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/app/clients");
  redirect(redirectTo ?? "/app/clients");
}

export async function updateClientAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const id = String(formData.get("id") ?? "");
    const client = await prisma.client.findFirst({ where: { id, userId: user.id } });
    if (!client) throw new NotFoundError("Client introuvable.");
    const input = clientSchema.parse({
      name: formData.get("name"),
      companyName: formData.get("companyName"),
      email: formData.get("email"),
      notes: formData.get("notes"),
    });
    await prisma.client.update({ where: { id }, data: input });
    revalidatePath("/app/clients");
    return { ok: true, message: "Client mis à jour." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteClientAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.client.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app/clients");
}

export async function updateClientDirectAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const client = await prisma.client.findFirst({ where: { id, userId: user.id } });
  if (!client) throw new NotFoundError("Client introuvable.");
  const input = clientSchema.parse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });
  await prisma.client.update({ where: { id }, data: input });
  revalidatePath("/app/clients");
}
