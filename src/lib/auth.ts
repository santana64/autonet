import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addDays, generateRawToken, hashToken } from "@/domain/auth/tokens";
import { UnauthorizedError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "autonet_session";

export async function createSession(userId: string) {
  const rawToken = generateRawToken();
  const expiresAt = addDays(new Date(), 30);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt,
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireUserOrRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function assertUserOwnsResource<T extends { userId: string } | null>(
  resource: T,
  userId: string,
  message = "Ressource introuvable."
) {
  if (!resource || resource.userId !== userId) {
    throw new UnauthorizedError(message);
  }
  return resource;
}

export async function ensureUserDefaults(userId: string) {
  await prisma.businessProfile.upsert({
    where: { userId },
    create: {
      userId,
      mainActivityCategory: "SERVICE_BNC",
      activityCategories: ["SERVICE_BNC"],
      declarationFrequency: "MONTHLY",
      vatStatus: "UNKNOWN",
      contributionRulesYear: 2026,
      conservativeReserveBufferRate: 0.05,
    },
    update: {},
  });
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan: "FREE", status: "free" },
    update: {},
  });
}
