import { subMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { RateLimitError } from "@/lib/errors";

const LIMITS: Record<string, { attempts: number; windowMinutes: number }> = {
  login: { attempts: 8, windowMinutes: 15 },
  register: { attempts: 5, windowMinutes: 60 },
  forgotPassword: { attempts: 4, windowMinutes: 30 },
  resetPassword: { attempts: 5, windowMinutes: 30 },
  resendVerification: { attempts: 4, windowMinutes: 30 },
  leadCapture: { attempts: 3, windowMinutes: 60 },
};

export async function assertRateLimit(key: string, action: keyof typeof LIMITS) {
  const limit = LIMITS[action];
  const since = subMinutes(new Date(), limit.windowMinutes);
  const count = await prisma.rateLimitEvent.count({
    where: { key, action, createdAt: { gte: since } },
  });
  if (count >= limit.attempts) {
    throw new RateLimitError();
  }
  await prisma.rateLimitEvent.create({ data: { key, action } });
}
