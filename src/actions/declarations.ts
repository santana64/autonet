"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureDeclarationPeriods, refreshDeclarationSnapshot } from "@/lib/periods";
import { requireUser } from "@/lib/auth";
import { NotFoundError, toActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/actions/auth";

export async function generatePeriodsAction(formData: FormData) {
  const user = await requireUser();
  const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new NotFoundError("Profil activité incomplet.");
  const year = Number(formData.get("year") ?? new Date().getFullYear());
  await ensureDeclarationPeriods(user.id, year, profile.declarationFrequency);
  revalidatePath("/app/declarations");
}

export async function refreshDeclarationSnapshotAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await refreshDeclarationSnapshot(user.id, id);
  revalidatePath(`/app/declarations/${id}`);
  revalidatePath("/app/declarations");
}

export async function updateDeclarationStatusAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const data =
    status === "DECLARED"
      ? { status: "DECLARED" as const, declaredAt: new Date() }
      : status === "PAID"
        ? { status: "PAID" as const, paidAt: new Date() }
        : status === "READY"
          ? { status: "READY" as const }
          : { status: "OPEN" as const };
  const updated = await prisma.declarationPeriod.updateMany({ where: { id, userId: user.id }, data });
  if (!updated.count) throw new NotFoundError("Période de déclaration introuvable.");
  await refreshDeclarationSnapshot(user.id, id);
  revalidatePath(`/app/declarations/${id}`);
  revalidatePath("/app/declarations");
}

export async function addDeclarationNoteAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const id = String(formData.get("id") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();
    const updated = await prisma.declarationPeriod.updateMany({
      where: { id, userId: user.id },
      data: { notes },
    });
    if (!updated.count) throw new NotFoundError("Période de déclaration introuvable.");
    revalidatePath(`/app/declarations/${id}`);
    return { ok: true, message: "Note enregistrée." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function openDeclarationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  redirect(`/app/declarations/${id}`);
}
