"use server";

import { redirect } from "next/navigation";
import { addMinutes, generateRawToken, hashToken, isTokenUsable } from "@/domain/auth/tokens";
import { hashPassword, verifyPassword } from "@/domain/auth/passwords";
import { createSession, destroySession, ensureUserDefaults, requireUser } from "@/lib/auth";
import { EmailError, NotFoundError, RateLimitError, ValidationError, toActionError } from "@/lib/errors";
import { resetPasswordEmail, verificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation";

export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
};

export async function registerAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let emailDeliveryWarning: string | null = null;
  try {
    const input = registerSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    await assertRateLimit(input.email, "register");
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return { error: "Un compte existe déjé avec cet email." };

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
      },
    });
    await ensureUserDefaults(user.id);

    const token = await createVerificationToken(user.id);
    try {
      await verificationEmail(user.email, token);
    } catch (error) {
      if (error instanceof EmailError) {
        emailDeliveryWarning = "Compte créé. Email de vérification non envoyé : service email non configuré.";
      } else {
        throw error;
      }
    }
    await createSession(user.id);
  } catch (error) {
    return toActionError(error);
  }

  redirect(emailDeliveryWarning ? `/app/onboarding?notice=${encodeURIComponent(emailDeliveryWarning)}` : "/app/onboarding");
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let next = "/app";
  try {
    const input = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    next = String(formData.get("next") || "/app");
    await assertRateLimit(input.email, "login");
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return { error: "Email ou mot de passe invalide." };
    }
    await ensureUserDefaults(user.id);
    await createSession(user.id);
  } catch (error) {
    return toActionError(error);
  }

  const safeNext = /^\/app(\/[\w\-./]*)?$/.test(next) ? next : "/app";
  redirect(safeNext);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const input = forgotPasswordSchema.parse({ email: formData.get("email") });
    await assertRateLimit(input.email, "forgotPassword");
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      return { ok: true, message: "Si un compte existe, un email de réinitialisation sera envoyé." };
    }
    const token = generateRawToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: addMinutes(new Date(), 45),
      },
    });
    await resetPasswordEmail(user.email, token);
    return { ok: true, message: "Email de réinitialisation envoyé." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetPasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const input = resetPasswordSchema.parse({
      token: formData.get("token"),
      password: formData.get("password"),
    });
    await assertRateLimit(input.token.slice(0, 16), "resetPassword");
    const tokenHash = hashToken(input.token);
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!resetToken || !isTokenUsable(resetToken)) {
      return { error: "Lien de réinitialisation expiré ou déjé utilisé." };
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: await hashPassword(input.password) },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
    ]);
    return { ok: true, message: "Mot de passe mis à jour. Vous pouvez vous connecter." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function verifyEmailToken(token: string) {
  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!tokenRecord || !isTokenUsable(tokenRecord)) {
    throw new NotFoundError("Lien de vérification expiré ou déjé utilisé.");
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

export async function resendVerificationAction(): Promise<ActionState> {
  try {
    const user = await requireUser();
    await assertRateLimit(user.email, "resendVerification");
    if (user.emailVerifiedAt) return { ok: true, message: "Votre email est déjé vérifié." };
    const token = await createVerificationToken(user.id);
    await verificationEmail(user.email, token);
    return { ok: true, message: "Email de vérification envoyé." };
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof EmailError || error instanceof ValidationError) {
      return toActionError(error);
    }
    return toActionError(error);
  }
}

export async function resendVerificationDirectAction(): Promise<void> {
  await resendVerificationAction();
}

async function createVerificationToken(userId: string) {
  const token = generateRawToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: addMinutes(new Date(), 60 * 24),
    },
  });
  return token;
}
