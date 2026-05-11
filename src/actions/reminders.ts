"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { NotFoundError, toActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { reminderSchema } from "@/lib/validation";
import type { ActionState } from "@/actions/auth";

export async function createReminderAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const input = reminderSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      dueDate: formData.get("dueDate"),
      type: formData.get("type"),
    });
    await prisma.reminder.create({ data: { userId: user.id, ...input } });
    revalidatePath("/app");
    revalidatePath("/app/reminders");
    return { ok: true, message: "Rappel créé." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateReminderStatusAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["DONE", "CANCELLED", "PENDING"].includes(status)) throw new NotFoundError("Rappel introuvable.");
  await prisma.reminder.updateMany({ where: { id, userId: user.id }, data: { status: status as never } });
  revalidatePath("/app");
  revalidatePath("/app/reminders");
}
