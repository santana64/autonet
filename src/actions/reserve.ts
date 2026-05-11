"use server";

import { revalidatePath } from "next/cache";
import { calculateSafeAvailableMoney } from "@/domain/cashflow/cashflow";
import { applyReserveEvent, getReserveRecommendation } from "@/domain/reserve/reserve";
import { requireUser } from "@/lib/auth";
import { BillingError, toActionError } from "@/lib/errors";
import { getUserPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { reserveEventSchema, reserveSnapshotSchema } from "@/lib/validation";
import type { ActionState } from "@/actions/auth";

export async function saveReserveSnapshotAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const plan = await getUserPlan(user.id);
    if (plan !== "PRO" && plan !== "CABINET") {
      throw new BillingError("Votre offre actuelle ne permet pas cette action.");
    }
    const input = reserveSnapshotSchema.parse({
      bankBalanceCents: formData.get("bankBalance"),
      manuallyReservedCents: formData.get("manuallyReserved"),
      notes: formData.get("notes"),
    });
    const targetReserveCents = Number(formData.get("targetReserveCents") ?? 0);
    const recommendation = getReserveRecommendation({
      targetReserveCents,
      manuallyReservedCents: input.manuallyReservedCents,
      bankBalanceCents: input.bankBalanceCents,
    });

    await prisma.cashReserveSnapshot.create({
      data: {
        userId: user.id,
        snapshotDate: new Date(),
        bankBalanceCents: input.bankBalanceCents || null,
        manuallyReservedCents: input.manuallyReservedCents,
        targetReserveCents,
        missingReserveCents: recommendation.missingReserveCents,
        safeAvailableCents: calculateSafeAvailableMoney({
          bankBalanceCents: input.bankBalanceCents,
          targetReserveCents,
          manuallyReservedCents: input.manuallyReservedCents,
        }),
        notes: input.notes,
      },
    });
    revalidatePath("/app/reserve");
    revalidatePath("/app");
    return { ok: true, message: "Réserve enregistrée." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function addReserveEventAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const plan = await getUserPlan(user.id);
    if (plan !== "PRO" && plan !== "CABINET") {
      throw new BillingError("Votre offre actuelle ne permet pas cette action.");
    }
    const input = reserveEventSchema.parse({
      type: formData.get("type"),
      amountCents: formData.get("amount"),
      eventDate: formData.get("eventDate"),
      note: formData.get("note"),
    });
    const latest = await prisma.cashReserveSnapshot.findFirst({
      where: { userId: user.id },
      orderBy: { snapshotDate: "desc" },
    });
    const nextReserved = applyReserveEvent(latest?.manuallyReservedCents ?? 0, {
      type: input.type,
      amountCents: input.amountCents,
    });
    await prisma.reserveEvent.create({ data: { userId: user.id, ...input } });
    if (latest) {
      await prisma.cashReserveSnapshot.create({
        data: {
          userId: user.id,
          snapshotDate: input.eventDate,
          bankBalanceCents: latest.bankBalanceCents,
          manuallyReservedCents: nextReserved,
          targetReserveCents: latest.targetReserveCents,
          missingReserveCents: Math.max(0, latest.targetReserveCents - nextReserved),
          safeAvailableCents: calculateSafeAvailableMoney({
            bankBalanceCents: latest.bankBalanceCents,
            targetReserveCents: latest.targetReserveCents,
            manuallyReservedCents: nextReserved,
          }),
          notes: input.note,
        },
      });
    }
    revalidatePath("/app/reserve");
    revalidatePath("/app");
    return { ok: true, message: "Mouvement de réserve ajouté." };
  } catch (error) {
    return toActionError(error);
  }
}
