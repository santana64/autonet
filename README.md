# AutoNet

AutoNet est un SaaS français cashflow-first pour auto-entrepreneurs et micro-entrepreneurs.

Promesse produit : savoir combien d'argent encaissé peut réellement être gardé après réserve URSSAF, impôt libératoire éventuel, coussin prudent et risques de seuils.

> AutoNet fournit des estimations pour vous aider à anticiper vos cotisations, impôts et seuils. L'outil ne remplace pas l'URSSAF, un expert-comptable, un conseiller fiscal ou les textes officiels. Les montants sont à vérifier selon votre situation.

## Stack

- Next.js App Router, TypeScript strict, TailwindCSS
- Prisma ORM, PostgreSQL
- Zod, Server Actions, custom credentials auth
- bcryptjs password hashing, DB sessions, hashed single-use tokens
- Stripe subscriptions and webhook
- Resend or SMTP email abstraction
- Vitest domain tests

## Local Setup

```bash
npm install
docker compose up -d
npm run db:deploy
npm run db:seed
npm run dev
```

The Docker database is exposed on local port `5434`.

Demo account for local development only:

- Email: `demo@autonet.fr`
- Password: `Autonet-demo-2026!`

## Environment

Copy `.env.example` to `.env` and adjust values.

Required for local DB:

```bash
DATABASE_URL="postgresql://autonet:autonet@localhost:5434/autonet?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SESSION_COOKIE_NAME="autonet_session"
```

Email:

- `RESEND_API_KEY` for Resend, or
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`
- `EMAIL_FROM`

If no provider is configured, email actions return `Service email non configuré.` instead of pretending a message was sent.

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_CABINET`
- `NEXT_PUBLIC_APP_URL`

If Stripe is missing locally, checkout and portal actions fail honestly with `Stripe n'est pas configuré en local.`

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run test
npm run lint
npm run db:push
npm run db:migrate
npm run db:deploy
npm run db:seed
```

## Prisma

Schema: `prisma/schema.prisma`

Main models:

- `User`, `Session`, `EmailVerificationToken`, `PasswordResetToken`
- `BusinessProfile`, `Client`, `RevenueEntry`
- `DeclarationPeriod`, `DeclarationSnapshot`
- `CashReserveSnapshot`, `ReserveEvent`
- `Reminder`, `GeneratedDocument`, `Subscription`, `RateLimitEvent`

Production deploy:

```bash
npm run db:deploy
```

Development migration:

```bash
npm run db:migrate
```

## Domain Logic

Rules live in `src/domain/rules/default-rules.ts`.

The default year is `2026`. Rules are versioned and centralized with cautious notes for:

- 203 100 EUR annual micro threshold for sales / certain commercial activities / some accommodation activities
- 83 600 EUR annual micro threshold for services and liberal activities
- mixed activity global threshold and service part threshold
- cautious VAT/franchise monitoring thresholds
- activity-specific contribution, training and tax-withholding rates

Cashflow logic lives in:

- `src/domain/cashflow`
- `src/domain/simulator`
- `src/domain/reserve`
- `src/domain/thresholds`
- `src/domain/declarations`
- `src/domain/documents`

## Product Limits

- Free: 20 revenue entries/month, basic dashboard, basic simulator, no document export, no advanced reserve tracking
- Starter: unlimited entries, declaration tracking, threshold radar, reminders, basic documents
- Pro: advanced simulator, reserve management, unlimited documents, CSV export, accountant export, email reminders
- Cabinet: future multi-business structure, advanced exports, priority/support-ready structure

## Security Notes

- Protected `/app/*` routes through middleware plus server-side `requireUser()`
- All mutations scope by `userId`
- Server-side plan enforcement for entries, clients, documents, CSV, simulator and reserve features
- Passwords hashed with bcrypt
- Sessions stored as hashed opaque tokens in DB
- Reset and verification tokens are hashed, expiring and single-use
- Stripe webhook validates signatures
- User-controlled HTML is escaped in generated documents
- Account data export and account deletion are implemented
- No secrets in `.env.example`

## UX Direction

The base UI is intentionally calm and financial: white canvas, dense but readable figures, restrained borders, clear status badges and a single green/teal success accent. It was shaped with Refero-style SaaS references in mind, especially clean financial dashboards and high-clarity product previews.

## Limitations

- AutoNet does not submit declarations to URSSAF.
- PDF export is implemented as robust printable/exportable HTML in v1.
- Rules are configurable defaults and must be reviewed against official sources before production use.
- Cabinet multi-business support is plan-ready but not exposed as a full portfolio UI in v1.
