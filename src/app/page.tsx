import {
  ArrowRight,
  BadgeEuro,
  CheckCircle2,
  Gauge,
  Lock,
  Server,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LEGAL_DISCLAIMER } from "@/domain/rules/default-rules";

const modules = [
  {
    title: "Cash disponible",
    desc: "Ce que tu encaisses, ce que tu réserves, ce que tu peux vraiment utiliser.",
    icon: WalletCards,
    accent: "#0c8c5e",
    tint: "rgba(12,140,94,0.08)",
  },
  {
    title: "Salaire réel",
    desc: "Transforme ton CA mensuel en revenu prudent, en une ligne.",
    icon: BadgeEuro,
    accent: "#2f6fed",
    tint: "rgba(47,111,237,0.08)",
  },
  {
    title: "Décision d'achat",
    desc: "Avant chaque dépense : AutoNet te dit si c'est le bon moment.",
    icon: ShoppingBag,
    accent: "#b76e00",
    tint: "rgba(183,110,0,0.08)",
  },
  {
    title: "Réserve",
    desc: "Combien de jours tu tiens si les encaissements s'arrêtent demain.",
    icon: ShieldCheck,
    accent: "#0c8c5e",
    tint: "rgba(12,140,94,0.08)",
  },
  {
    title: "Radar seuils",
    desc: "TVA, micro, changements de statut — vois la marge avant qu'il soit trop tard.",
    icon: Gauge,
    accent: "#2f6fed",
    tint: "rgba(47,111,237,0.08)",
  },
  {
    title: "Prix minimum",
    desc: "Le tarif ou le nombre de ventes pour atteindre ton revenu cible.",
    icon: Zap,
    accent: "#b76e00",
    tint: "rgba(183,110,0,0.08)",
  },
];

const prices = [
  {
    name: "Free",
    price: "0",
    sub: "/mois",
    desc: "Pour tester sans friction.",
    items: ["5 encaissements/mois", "Cash disponible", "Seuils simplifiés", "1 objectif revenu"],
    cta: "Commencer gratuitement",
    href: "/register",
    variant: "secondary" as const,
  },
  {
    name: "Solo",
    price: "9",
    sub: "/mois",
    desc: "Pour piloter au quotidien.",
    items: ["Encaissements illimités", "Dashboard complet", "Salaire réel", "Réserve", "Documents"],
    cta: "Choisir Solo",
    href: "/register?plan=solo",
    variant: "secondary" as const,
  },
  {
    name: "Pro",
    price: "19",
    sub: "/mois",
    desc: "Pour décider avant de dépenser.",
    highlighted: true,
    items: ["Je peux acheter ça ?", "Prix minimum rentable", "Stress test", "Scénarios", "Exports avancés"],
    cta: "Choisir Pro",
    href: "/register?plan=pro",
    variant: "primary" as const,
  },
];

export default function LandingPage() {
  const lifetimeHref = process.env.NEXT_PUBLIC_LIFETIME_PAYMENT_LINK || "/register?offer=lifetime";
  const lifetimeExternal = lifetimeHref.startsWith("http");

  return (
    <main className="bg-white text-[#061b31]">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#061b31]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#0c8c5e] text-xs shadow-[0_4px_12px_rgba(12,140,94,0.35)]">
              AN
            </span>
            AutoNet
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a className="hidden font-medium text-white/60 transition hover:text-white sm:inline" href="/calculateur">
              Calculateur
            </a>
            <a className="hidden font-medium text-white/60 transition hover:text-white sm:inline" href="#prix">
              Tarifs
            </a>
            <a
              className="inline-flex h-9 items-center rounded-[6px] border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
              href="/login"
            >
              Connexion
            </a>
          </nav>
        </div>
      </header>

      {/* ─── Lifetime banner ─── */}
      <div className="border-b border-[#0c8c5e]/30 bg-[#0c8c5e]/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-3 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="font-semibold text-[#0c8c5e]">
            Lifetime bêta — 100 places, accès Pro à vie pour 79 €.
          </p>
          <a
            className="inline-flex h-8 shrink-0 items-center gap-2 rounded-[6px] bg-[#0c8c5e] px-4 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(12,140,94,0.25)] transition hover:bg-[#08764f]"
            href={lifetimeHref}
            target={lifetimeExternal ? "_blank" : undefined}
            rel={lifetimeExternal ? "noopener noreferrer" : undefined}
          >
            Réserver ma place
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* ─── Hero ─── */}
      <section className="ap-grid relative overflow-hidden bg-[#061b31]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#061b31]/60 pointer-events-none" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-28 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0c8c5e]/30 bg-[#0c8c5e]/10 px-3 py-1 text-xs font-semibold text-[#4ade80]">
              Le cockpit financier de l'indépendant français
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Ton compte affiche du CA.{" "}
              <span className="text-[#0c8c5e]">AutoNet te montre ton vrai argent.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
              Saisis ce que tu encaisses. AutoNet te dit quoi mettre de côté, quoi garder, quoi te verser — et si une dépense est prudente.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/calculateur" className="shadow-[0_8px_24px_rgba(12,140,94,0.35)]">
                Calculer sans inscription
                <ArrowRight aria-hidden className="h-4 w-4" />
              </ButtonLink>
              <a
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                href="/register"
              >
                Créer un compte gratuit
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-white/40">
              <span className="flex items-center gap-1.5">
                <Lock aria-hidden className="h-3.5 w-3.5" />
                Aucun accès à ta banque
              </span>
              <span className="flex items-center gap-1.5">
                <Zap aria-hidden className="h-3.5 w-3.5" />
                Résultat immédiat
              </span>
              <span className="flex items-center gap-1.5">
                <Server aria-hidden className="h-3.5 w-3.5" />
                Données hébergées en France
              </span>
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="hero-float rounded-[12px] border border-white/10 bg-white p-5 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#d8dfe8] pb-4">
              <div>
                <p className="text-xs font-medium text-[#50617a]">Argent vraiment utilisable</p>
                <p className="mt-1 text-4xl font-bold tracking-tight text-[#061b31]">1 958 €</p>
              </div>
              <span className="rounded-[6px] bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Feu vert
              </span>
            </div>
            <div className="divide-y divide-[#d8dfe8]">
              <PreviewRow label="Tu as encaissé" value="3 200 €" />
              <PreviewRow label="À réserver URSSAF" value="704 €" />
              <PreviewRow label="À réserver impôt" value="128 €" />
              <PreviewRow label="Réserve prudente" value="320 €" />
              <PreviewRow label="Tu peux te verser" value="1 500 €" strong />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <PreviewSignal icon={ShoppingBag} label="MacBook ?" value="Pas ce mois-ci" />
              <PreviewSignal icon={BadgeEuro} label="Salaire cible" value="69 %" />
              <PreviewSignal icon={ShieldCheck} label="Airbag" value="41 jours" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section className="border-b border-[#e5edf5] bg-[#f8fafd] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            <Problem
              number="1"
              title="Tu confonds CA et argent à toi."
              desc="3 200 € encaissés, ce n'est pas 3 200 € disponibles. URSSAF, impôt, CFE — la note arrive toujours."
            />
            <Problem
              number="2"
              title="Tu ne sais pas combien te verser sans risque."
              desc="Trop peu, tu te pénalises. Trop, tu te retrouves en déficit à la déclaration. Il n'existe pas de ligne claire."
            />
            <Problem
              number="3"
              title="Les alertes URSSAF n'arrivent jamais au bon moment."
              desc="Les seuils changent ton cash disponible. Personne ne te prévient avant qu'il soit trop tard."
            />
          </div>
        </div>
      </section>

      {/* ─── Modules ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="modules">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold text-[#0c8c5e]">Ce qu'AutoNet fait</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#061b31]">
            Un système de décision,<br />pas une compta.
          </h2>
          <p className="mt-4 text-lg text-[#50617a]">
            Après chaque encaissement, tu sais exactement quoi faire avec l'argent.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                className="group rounded-[10px] border border-[#d8dfe8] bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_rgba(6,27,49,0.08)]"
                key={mod.title}
              >
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[8px]"
                  style={{ background: mod.tint, color: mod.accent }}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-[#061b31]">{mod.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#50617a]">{mod.desc}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/calculateur" variant="secondary">
            Essayer gratuitement
            <ArrowRight aria-hidden className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      {/* ─── Social proof / trust ─── */}
      <section className="border-y border-[#e5edf5] bg-[#f8fafd] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            <Trust
              icon={Lock}
              title="Aucun accès bancaire"
              desc="Tu saisis toi-même tes encaissements. AutoNet ne se connecte à aucun compte, aucune API bancaire."
            />
            <Trust
              icon={TrendingUp}
              title="Calculs en temps réel"
              desc="Chaque chiffre est recalculé à la saisie avec les taux officiels de l'année en cours."
            />
            <Trust
              icon={Server}
              title="Données hébergées en France"
              desc="Infrastructure européenne, conforme RGPD. Export complet de tes données à tout moment."
            />
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="prix">
        <div className="mb-12">
          <p className="text-sm font-semibold text-[#0c8c5e]">Tarifs</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#061b31]">Simple. Sans surprise.</h2>
          <p className="mt-3 text-lg text-[#50617a]">
            Gratuit pour tester. Payant quand c'est utile.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {prices.map((plan) => (
            <div
              className={`flex flex-col rounded-[10px] border p-6 ${
                plan.highlighted
                  ? "border-[#0c8c5e] bg-white shadow-[0_8px_40px_rgba(12,140,94,0.14)] ring-2 ring-[#0c8c5e]/20"
                  : "border-[#d8dfe8] bg-white"
              }`}
              key={plan.name}
            >
              {plan.highlighted && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-[#0c8c5e] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Recommandé
                </span>
              )}
              <h3 className="text-lg font-bold text-[#061b31]">{plan.name}</h3>
              <p className="mt-1 text-sm text-[#50617a]">{plan.desc}</p>
              <p className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight text-[#061b31]">{plan.price} €</span>
                <span className="mb-1 text-sm text-[#64748d]">{plan.sub}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-[#50617a]">
                {plan.items.map((item) => (
                  <li className="flex items-start gap-2" key={item}>
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#0c8c5e]" />
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink className="mt-6 w-full justify-center" href={plan.href} variant={plan.variant}>
                {plan.cta}
              </ButtonLink>
            </div>
          ))}

          {/* Lifetime card */}
          <div className="flex flex-col rounded-[10px] border border-[#2f6fed]/30 bg-gradient-to-br from-[#2f6fed]/5 to-white p-6">
            <span className="mb-3 inline-flex w-fit rounded-full bg-[#2f6fed]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2f6fed]">
              100 places
            </span>
            <h3 className="text-lg font-bold text-[#061b31]">Lifetime bêta</h3>
            <p className="mt-1 text-sm text-[#50617a]">Accès Pro à vie, une seule fois.</p>
            <p className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-bold tracking-tight text-[#061b31]">79 €</span>
              <span className="mb-1 text-sm text-[#64748d]"> une fois</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-[#50617a]">
              {["Accès Pro bêta à vie", "Prix bloqué pour toujours", "Retours terrain prioritaires"].map((item) => (
                <li className="flex items-start gap-2" key={item}>
                  <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#2f6fed]" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#2f6fed]/30 bg-[#2f6fed]/10 px-4 py-2.5 text-sm font-semibold text-[#2f6fed] transition hover:bg-[#2f6fed]/20"
              href={lifetimeHref}
              rel={lifetimeExternal ? "noopener noreferrer" : undefined}
              target={lifetimeExternal ? "_blank" : undefined}
            >
              Réserver ma place
              <ArrowRight aria-hidden className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="ap-grid relative overflow-hidden bg-[#061b31] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-t from-[#061b31] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Arrête de confondre chiffre d'affaires<br />et argent à toi.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/60">
            Calcule ton vrai disponible en 30 secondes. Sans inscription, sans connexion bancaire, sans bullshit.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/calculateur" className="shadow-[0_8px_24px_rgba(12,140,94,0.35)]">
              Calculer sans inscription
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              href="/register"
            >
              Créer un compte gratuit
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#e5edf5] bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-sm font-bold text-[#061b31]">
              <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#0c8c5e] text-xs text-white">
                AN
              </span>
              AutoNet
            </div>
            <nav className="flex flex-wrap gap-4 text-sm text-[#50617a]">
              <a className="hover:text-[#061b31]" href="/conditions-generales">CGU</a>
              <a className="hover:text-[#061b31]" href="/confidentialite">Confidentialité</a>
              <a className="hover:text-[#061b31]" href="/mentions-legales">Mentions légales</a>
              <a className="hover:text-[#061b31]" href="/cookies">Cookies</a>
            </nav>
          </div>
          <p className="mt-5 text-xs leading-5 text-[#64748d]">{LEGAL_DISCLAIMER}</p>
        </div>
      </footer>
    </main>
  );
}

function Problem({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#061b31] text-xs font-bold text-white">
        {number}
      </span>
      <div>
        <h3 className="font-semibold text-[#061b31]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#50617a]">{desc}</p>
      </div>
    </div>
  );
}

function Trust({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef4f8] text-[#0c8c5e]">
        <Icon aria-hidden className="h-4 w-4" />
      </div>
      <div>
        <h3 className="font-semibold text-[#061b31]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#50617a]">{desc}</p>
      </div>
    </div>
  );
}

function PreviewRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-[#50617a]">{label}</span>
      <span className={strong ? "font-bold text-[#0c8c5e]" : "font-medium text-[#061b31]"}>{value}</span>
    </div>
  );
}

function PreviewSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[6px] bg-[#f8fafd] p-3">
      <Icon aria-hidden className="h-4 w-4 text-[#2f6fed]" />
      <p className="mt-2 text-[10px] font-medium text-[#50617a]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#061b31]">{value}</p>
    </div>
  );
}
