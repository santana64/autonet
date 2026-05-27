# AutoNet - Gestion de Garage Automobile

SaaS complet pour garages et mecaniciens. Gerez vos clients, vehicules, ordres de reparation et factures depuis une interface unique.

## Stack

- Next.js 14 (App Router)
- PostgreSQL + Prisma
- Stripe (facturation en ligne)
- Resend + Nodemailer (notifications)
- Claude API (diagnostics assistes par IA)
- Tailwind CSS + React Hook Form + Zod

## Fonctionnalites

- Fiche client et historique vehicule complet
- Ordres de reparation avec suivi temps et pieces
- Facturation avec generation PDF
- Rappels revision et contr ole technique automatiques
- IA : aide au diagnostic, description des reparations (Claude API)
- Tableau de bord : CA mensuel, taux d occupation, alertes

## Demarrage

bash
npm install
npx prisma migrate dev
npm run dev


Variables requises : DATABASE_URL, STRIPE_SECRET_KEY, ANTHROPIC_API_KEY, RESEND_API_KEY