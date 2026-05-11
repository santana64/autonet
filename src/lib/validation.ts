import { z } from "zod";
import { ACTIVITY_CATEGORIES } from "@/domain/activity";
import { eurosToCents } from "@/domain/formatting/format";

const requiredString = z.string().trim().min(1, "Champ obligatoire");
const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null))
  .nullable()
  .optional();

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120).optional().nullable(),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(10, "Mot de passe trop court"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(10, "Mot de passe trop court"),
});

export const businessProfileSchema = z.object({
  businessName: optionalString,
  ownerName: optionalString,
  siret: optionalString,
  siren: optionalString,
  address: optionalString,
  postalCode: optionalString,
  city: optionalString,
  email: optionalString,
  phone: optionalString,
  mainActivityCategory: z.enum(ACTIVITY_CATEGORIES),
  activityCategories: z.array(z.enum(ACTIVITY_CATEGORIES)).min(1),
  mixedActivityEnabled: z.boolean(),
  declarationFrequency: z.enum(["MONTHLY", "QUARTERLY"]),
  vatStatus: z.enum(["FRANCHISE_BASE", "VAT_LIABLE", "UNKNOWN"]),
  taxWithholdingEnabled: z.boolean(),
  contributionRulesYear: z.coerce.number().int().min(2026).max(2035),
  conservativeReserveBufferRate: z.coerce.number().min(0).max(1).default(0.05),
  reminderEmailEnabled: z.boolean(),
  documentFooterText: optionalString,
  defaultSignature: optionalString,
});

export const clientSchema = z.object({
  id: z.string().optional(),
  name: requiredString.max(160),
  companyName: optionalString,
  email: optionalString,
  notes: optionalString,
});

export const revenueSchema = z.object({
  id: z.string().optional(),
  clientId: z
    .string()
    .trim()
    .transform((value) => (value ? value : null))
    .nullable()
    .optional(),
  clientName: optionalString,
  description: optionalString,
  activityCategory: z.enum(ACTIVITY_CATEGORIES),
  invoiceDate: z
    .string()
    .trim()
    .transform((value) => (value ? new Date(value) : null))
    .nullable()
    .optional(),
  collectionDate: z.string().trim().transform((value) => new Date(value)),
  grossAmountCents: z.union([z.string(), z.number()]).transform(eurosToCents),
  paymentMethod: optionalString,
  status: z.enum(["COLLECTED", "PENDING_INVOICE", "EXCLUDED"]),
  notes: optionalString,
});

export const accountSchema = z.object({
  name: optionalString,
  email: z.string().trim().toLowerCase().email("Email invalide"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, "Mot de passe trop court"),
});

export const reminderSchema = z.object({
  title: requiredString.max(180),
  description: optionalString,
  dueDate: z.string().transform((value) => new Date(value)),
  type: z.enum(["DECLARATION_DUE", "RESERVE_MISSING", "THRESHOLD_WARNING", "VAT_WARNING", "CUSTOM"]),
});

export const reserveSnapshotSchema = z.object({
  bankBalanceCents: z.union([z.string(), z.number()]).optional().nullable().transform(eurosToCents),
  manuallyReservedCents: z.union([z.string(), z.number()]).transform(eurosToCents),
  notes: optionalString,
});

export const reserveEventSchema = z.object({
  type: z.enum(["SET_ASIDE", "RELEASED", "ADJUSTMENT"]),
  amountCents: z.union([z.string(), z.number()]).transform(eurosToCents),
  eventDate: z.string().transform((value) => new Date(value)),
  note: optionalString,
});
