import { createBillingPortalDirectAction, createCheckoutDirectAction } from "@/actions/billing";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { PLAN_LIMITS } from "@/domain/billing/plans";
import { formatShortDate } from "@/domain/formatting/format";
import { planLabels } from "@/domain/labels";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const displayedPlans = ["FREE", "STARTER", "PRO", "CABINET"] as const;

const planFeatures = {
  FREE: ["5 encaissements par mois", "disponible basique", "seuils simplifiés", "1 objectif revenu"],
  STARTER: ["entrées illimitées", "dashboard complet", "salaire réel", "réserve", "documents mensuels"],
  PRO: ["simulateur d'achat", "prix minimum rentable", "stress test", "scénarios", "exports avancés"],
  CABINET: ["portefeuille multi-clients", "exports avancés", "process cabinet", "accompagnement sur devis"],
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; cancelled?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const lifetimeHref = process.env.NEXT_PUBLIC_LIFETIME_PAYMENT_LINK || "/register?offer=lifetime";
  const lifetimeExternal = lifetimeHref.startsWith("http");

  return (
    <>
      <SectionHeader
        description="AutoNet ne vend pas de comptabilité complète : il vend la clarté sur ton argent réellement disponible."
        title="Offres"
      />
      {params?.success ? <p className="mb-4 rounded-[6px] bg-emerald-50 p-3 text-sm text-emerald-800">Paiement confirmé. L'abonnement sera synchronisé par webhook Stripe.</p> : null}
      {params?.cancelled ? <p className="mb-4 rounded-[6px] bg-amber-50 p-3 text-sm text-amber-900">Checkout annulé.</p> : null}

      <Card>
        <h2 className="text-lg font-semibold">Offre actuelle</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <p>Plan : <strong>{planLabels[(subscription?.plan ?? "FREE") as keyof typeof planLabels]}</strong></p>
          <p>Statut : <strong>{subscription?.status ?? "free"}</strong></p>
          <p>Fin période : <strong>{formatShortDate(subscription?.currentPeriodEnd)}</strong></p>
        </div>
        {!stripeConfigured ? (
          <p className="mt-4 rounded-[6px] bg-amber-50 p-3 text-sm text-amber-900">Stripe n'est pas configuré en local. Renseignez STRIPE_SECRET_KEY et les prix.</p>
        ) : null}
        {subscription?.stripeCustomerId ? (
          <form action={createBillingPortalDirectAction} className="mt-4">
            <Button type="submit" variant="secondary">Ouvrir le portail client</Button>
          </form>
        ) : null}
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {displayedPlans.map((plan) => {
          const limits = PLAN_LIMITS[plan];
          const isCabinet = plan === "CABINET";
          return (
            <Card className={plan === "PRO" ? "border-[#0c8c5e] ring-2 ring-[#0c8c5e]/20" : ""} key={plan}>
              <h3 className="text-lg font-bold">{limits.label}</h3>
              <p className="mt-2 text-3xl font-bold">
                {isCabinet ? "Sur devis" : `${limits.priceMonthly} €`}
                {!isCabinet ? <span className="text-sm font-medium text-[#64748d]">/mois</span> : null}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#50617a]">
                {planFeatures[plan].map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {plan === "FREE" ? (
                <p className="mt-5 text-sm text-[#64748d]">Pour tester sans friction.</p>
              ) : isCabinet ? (
                <ButtonLink className="mt-5" href="mailto:contact@autonet.fr?subject=Plan%20Cabinet%20AutoNet" variant="secondary">
                  Parler du plan Cabinet
                </ButtonLink>
              ) : (
                <form action={createCheckoutDirectAction} className="mt-5">
                  <input name="plan" type="hidden" value={plan} />
                  <Button disabled={!stripeConfigured} type="submit">
                    Choisir {limits.label}
                  </Button>
                </form>
              )}
            </Card>
          );
        })}

        <Card className="border-[#2f6fed]/40">
          <h3 className="text-lg font-bold">Lifetime bêta</h3>
          <p className="mt-2 text-3xl font-bold">
            79 €
            <span className="text-sm font-medium text-[#64748d]"> une fois</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#50617a]">
            <li>100 premiers utilisateurs</li>
            <li>accès Pro pendant la bêta</li>
            <li>retours terrain prioritaires</li>
            <li>témoignages et validation marché</li>
          </ul>
          <ButtonLink
            className="mt-5"
            href={lifetimeHref}
            target={lifetimeExternal ? "_blank" : undefined}
            variant="secondary"
          >
            Acheter Lifetime bêta
          </ButtonLink>
        </Card>
      </div>
    </>
  );
}
