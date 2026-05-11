export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Données invalides.") {
    super(message, "VALIDATION_ERROR", 422);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable.") {
    super(message, "NOT_FOUND", 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Vous devez être connecté.") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class DomainError extends AppError {
  constructor(message = "Une règle métier empêche cette action.") {
    super(message, "DOMAIN_ERROR", 400);
  }
}

export class BillingError extends AppError {
  constructor(message = "Votre offre actuelle ne permet pas cette action.") {
    super(message, "BILLING_ERROR", 402);
  }
}

export class EmailError extends AppError {
  constructor(message = "Service email non configuré.") {
    super(message, "EMAIL_ERROR", 503);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Trop de tentatives. Réessayez plus tard.") {
    super(message, "RATE_LIMIT_ERROR", 429);
  }
}

export function toActionError(error: unknown) {
  if (error instanceof AppError) {
    return { ok: false as const, error: error.message, code: error.code };
  }
  return { ok: false as const, error: "Une erreur est survenue.", code: "UNKNOWN" };
}
