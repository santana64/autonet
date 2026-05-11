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
import { LogoMark } from "@/components/ui/logo";
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
    title: "Réserve de survie",
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
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#061b31]/98 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight text-white">
            <LogoMark size={32} />
            AutoNet
          </div>
          <nav className="flex items-center gap-1">
            <a
              className="hidden rounded-[6px] px-3 py-2 text-[13px] font-medium text-white/50 transition hover:bg-white/8 hover:text-white sm:inline-flex"
              href="/calculateur"
            >
              Calculateur
            </a>
            <a
              className="hidden rounded-[6px] px-3 py-2 text-[13px] font-medium text-white/50 transition hover:bg-white/8 hover:text-white sm:inline-flex"
              href="#prix"
            >
              Tarifs
            </a>
            <a
              className="ml-2 inline-flex h-8 items-center rounded-[6px] bg-white/10 px-4 text-[13px] font-semibold text-white transition hover:bg-white/18"
              href="/login"
            >
              Connexion
            </a>
          </nav>
        </div>
      </header>

      {/* ─── Lifetime banner ─── */}
      <div className="relative border-b border-[#0c8c5e]/25 bg-[#0a1f14]">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-5 py-2.5 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-[#4ade80]">
            <span className="mr-2 rounded-sm bg-[#0c8c5e]/30 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#4ade80]">
              Bêta
            </span>
            100 places — accès Pro à vie pour 79 €. Sans abonnement, jamais.
          </p>
          <a
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[5px] bg-[#0c8c5e] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#0a7a52]"
            href={lifetimeHref}
            target={lifetimeExternal ? "_blank" : undefined}
            rel={lifetimeExternal ? "noopener noreferrer" : undefined}
          >
            Réserver ma place
            <ArrowRight aria-hidden className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-[#061b31] pb-0 pt-20 sm:pt-28">
        {/* Grid */}
        <div className="ap-grid pointer-events-none absolute inset-0 opacity-40" />
        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-[#0c8c5e]/10 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-5 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0c8c5e]/30 bg-[#0c8c5e]/10 px-3.5 py-1.5 text-[12px] font-semibold tracking-wide text-[#4ade80]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0c8c5e] shadow-[0_0_6px_rgba(12,140,94,0.8)]" />
            Cockpit financier pour auto-entrepreneurs
          </div>

          {/* H1 */}
          <h1 className="mx-auto mt-7 max-w-3xl text-[56px] font-black leading-[1.05] tracking-[-0.03em] text-white sm:text-[72px] lg:text-[88px]">
            Sais enfin combien
            <br />
            <span className="text-[#0c8c5e]">tu peux te verser.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-lg text-[17px] leading-[1.7] text-white/50">
            Tu encaisses 3 200 €. AutoNet calcule ce que tu dois mettre de côté — et ce qui est vraiment à toi.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/calculateur" className="h-11 px-6 text-[14px] shadow-[0_8px_32px_rgba(12,140,94,0.4)]">
              Calculer sans inscription
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
            <a
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] border border-white/15 px-6 text-[14px] font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              href="/register"
            >
              Créer un compte gratuit
            </a>
          </div>

          {/* Trust pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/30">
            <span className="flex items-center gap-1.5">
              <Lock aria-hidden className="h-3 w-3" />
              Aucun accès bancaire
            </span>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <span className="flex items-center gap-1.5">
              <Zap aria-hidden className="h-3 w-3" />
              Résultat immédiat
            </span>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <span className="flex items-center gap-1.5">
              <Server aria-hidden className="h-3 w-3" />
              Données en France
            </span>
          </div>

          {/* Product mock — flush to bottom of hero */}
          <div className="relative mt-14 mx-auto max-w-4xl">
            {/* Glow behind card */}
            <div className="pointer-events-none absolute -inset-4 rounded-[16px] bg-[#0c8c5e]/10 blur-[40px]" />
            {/* Browser chrome */}
            <div className="relative overflow-hidden rounded-t-[12px] border border-white/10 bg-[#0f1e2d] shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-1.5 border-b border-white/8 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="mx-auto rounded-[4px] bg-white/8 px-8 py-1 text-[11px] text-white/30">
                  app.autonet.fr/app
                </span>
              </div>
              {/* Dashboard content */}
              <div className="bg-[#f8fafd] p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Main signal card */}
                  <div className="sm:col-span-2 rounded-[10px] border border-[#d8dfe8] bg-white p-5 shadow-[0_2px_10px_rgba(6,27,49,0.04)]">
                    <div className="flex items-start justify-between gap-4 border-b border-[#d8dfe8] pb-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[#50617a]">
                          Argent disponible · Mai 2025
                        </p>
                        <p className="mt-1.5 text-[42px] font-black leading-none tracking-[-0.02em] text-[#061b31]">
                          1 958 €
                        </p>
                      </div>
                      <span className="rounded-[6px] bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700">
                        Feu vert
                      </span>
                    </div>
                    <div className="divide-y divide-[#d8dfe8]">
                      <PreviewRow label="Encaissé" value="3 200 €" />
                      <PreviewRow label="URSSAF (22 %)" value="704 €" />
                      <PreviewRow label="Impôt estimé (4 %)" value="128 €" />
                      <PreviewRow label="Réserve prudente" value="320 €" />
                      <PreviewRow label="Tu peux te verser" value="1 500 €" strong />
                    </div>
                  </div>
                  {/* Side widgets */}
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 rounded-[10px] border border-[#d8dfe8] bg-white p-4 shadow-[0_2px_10px_rgba(6,27,49,0.04)]">
                      <ShoppingBag aria-hidden className="h-4 w-4 text-[#b76e00]" />
                      <p className="mt-3 text-[11px] font-medium text-[#50617a]">MacBook Pro ?</p>
                      <p className="mt-0.5 text-[15px] font-bold text-[#061b31]">Pas ce mois-ci</p>
                      <p className="mt-1 text-[11px] text-[#50617a]">Reviens à 3 600 €/mois</p>
                    </div>
                    <div className="flex-1 rounded-[10px] border border-[#d8dfe8] bg-white p-4 shadow-[0_2px_10px_rgba(6,27,49,0.04)]">
                      <ShieldCheck aria-hidden className="h-4 w-4 text-[#2f6fed]" />
                      <p className="mt-3 text-[11px] font-medium text-[#50617a]">Airbag</p>
                      <p className="mt-0.5 text-[15px] font-bold text-[#061b31]">41 jours</p>
                      <p className="mt-1 text-[11px] text-[#50617a]">Réserve sécurisée</p>
                    </div>
                    <div className="flex-1 rounded-[10px] border border-[#d8dfe8] bg-white p-4 shadow-[0_2px_10px_rgba(6,27,49,0.04)]">
                      <BadgeEuro aria-hidden className="h-4 w-4 text-[#0c8c5e]" />
                      <p className="mt-3 text-[11px] font-medium text-[#50617a]">Salaire cible</p>
                      <p className="mt-0.5 text-[15px] font-bold text-[#061b31]">69 %</p>
                      <p className="mt-1 text-[11px] text-[#50617a]">Objectif atteint</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Fade to bg */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white" />
          </div>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section className="border-b border-[#e5edf5] bg-white px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-[13px] font-semibold uppercase tracking-widest text-[#50617a]">Le problème</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-center text-[32px] font-bold leading-[1.2] tracking-tight text-[#061b31]">
            Tu sais ce que tu gagnes.<br />Pas ce que tu peux garder.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Problem
              number="1"
              title="Tu confonds CA et argent disponible."
              desc="3 200 € encaissés ≠ 3 200 € à toi. URSSAF, CFE, impôt — la note arrive toujours."
            />
            <Problem
              number="2"
              title="Tu ne sais pas combien te verser."
              desc="Trop peu, tu te pénalises. Trop, tu es en déficit à la déclaration. Il n'y a jamais de ligne claire."
            />
            <Problem
              number="3"
              title="Les seuils te prennent par surprise."
              desc="TVA, changements de régime — personne ne te prévient avant qu'il soit trop tard pour ajuster."
            />
          </div>
        </div>
      </section>

      {/* ─── Modules ─── */}
      <section className="bg-[#f8fafd] px-5 py-20" id="modules">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-[#0c8c5e]">Ce qu'AutoNet fait</p>
            <h2 className="mt-4 text-[36px] font-bold tracking-tight text-[#061b31]">
              Un système de décision,<br className="hidden sm:inline" /> pas une compta.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[#50617a]">
              Après chaque encaissement, tu sais exactement quoi faire avec l'argent.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  className="rounded-[10px] border border-[#d8dfe8] bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_rgba(6,27,49,0.08)]"
                  key={mod.title}
                >
                  <div
                    className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[8px]"
                    style={{ background: mod.tint, color: mod.accent }}
                  >
                    <Icon aria-hidden className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-[#061b31]">{mod.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#50617a]">{mod.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/calculateur" variant="secondary">
              Essayer gratuitement — sans inscription
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ─── Trust ─── */}
      <section className="border-y border-[#e5edf5] bg-white px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <Trust
              icon={Lock}
              title="Aucun accès à ta banque"
              desc="Tu saisis toi-même tes encaissements. Aucune connexion bancaire, aucune API tierce."
            />
            <Trust
              icon={TrendingUp}
              title="Calculs officiels, en temps réel"
              desc="Taux URSSAF, versement libératoire, TVA franchise — tout est à jour et recalculé à la saisie."
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
      <section className="bg-[#f8fafd] px-5 py-20" id="prix">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-[#0c8c5e]">Tarifs</p>
            <h2 className="mt-4 text-[36px] font-bold tracking-tight text-[#061b31]">Simple. Sans surprise.</h2>
            <p className="mt-3 text-[16px] text-[#50617a]">Gratuit pour tester. Payant quand c'est utile.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {prices.map((plan) => (
              <div
                className={`flex flex-col rounded-[12px] border p-6 ${
                  plan.highlighted
                    ? "border-[#0c8c5e] bg-white shadow-[0_0_0_4px_rgba(12,140,94,0.08),0_8px_40px_rgba(12,140,94,0.12)]"
                    : "border-[#d8dfe8] bg-white"
                }`}
                key={plan.name}
              >
                {plan.highlighted && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-[#0c8c5e] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Recommandé
                  </span>
                )}
                <h3 className="text-[17px] font-bold text-[#061b31]">{plan.name}</h3>
                <p className="mt-1 text-[13px] text-[#50617a]">{plan.desc}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-[40px] font-black leading-none tracking-[-0.02em] text-[#061b31]">
                    {plan.price} €
                  </span>
                  <span className="mb-1 text-[13px] text-[#64748d]">{plan.sub}</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.items.map((item) => (
                    <li className="flex items-start gap-2 text-[13px] text-[#50617a]" key={item}>
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
            <div className="flex flex-col rounded-[12px] border border-[#061b31]/20 bg-[#061b31] p-6 text-white">
              <span className="mb-3 inline-flex w-fit rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                100 places
              </span>
              <h3 className="text-[17px] font-bold">Lifetime bêta</h3>
              <p className="mt-1 text-[13px] text-white/50">Accès Pro à vie, une seule fois.</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-[40px] font-black leading-none tracking-[-0.02em]">79 €</span>
                <span className="mb-1 text-[13px] text-white/40">une fois</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {[
                  "Accès Pro bêta à vie",
                  "Prix bloqué pour toujours",
                  "Retours terrain prioritaires",
                  "Sans abonnement, jamais",
                ].map((item) => (
                  <li className="flex items-start gap-2 text-[13px] text-white/70" key={item}>
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#4ade80]" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#0c8c5e] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#0a7a52]"
                href={lifetimeHref}
                rel={lifetimeExternal ? "noopener noreferrer" : undefined}
                target={lifetimeExternal ? "_blank" : undefined}
              >
                Réserver ma place
                <ArrowRight aria-hidden className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative overflow-hidden bg-[#061b31] px-5 py-24 text-white">
        <div className="ap-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-[#0c8c5e]/15 blur-[100px]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-[40px] font-black leading-[1.1] tracking-[-0.02em] sm:text-[52px]">
            Arrête de deviner.<br />
            <span className="text-[#0c8c5e]">Commence à décider.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-white/50">
            30 secondes. Pas d'inscription. Tu vois ton vrai revenu disponible — et si ta prochaine dépense est raisonnable.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/calculateur" className="h-11 px-6 shadow-[0_8px_32px_rgba(12,140,94,0.4)]">
              Calculer sans inscription
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
            <a
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] border border-white/15 px-6 text-[14px] font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
              href="/register"
            >
              Créer un compte gratuit
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#e5edf5] bg-white px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5 text-[14px] font-bold text-[#061b31]">
              <LogoMark size={28} />
              AutoNet
            </div>
            <nav className="flex flex-wrap gap-5 text-[13px] text-[#50617a]">
              <a className="transition hover:text-[#061b31]" href="/calculateur">Calculateur gratuit</a>
              <a className="transition hover:text-[#061b31]" href="/conditions-generales">CGU</a>
              <a className="transition hover:text-[#061b31]" href="/confidentialite">Confidentialité</a>
              <a className="transition hover:text-[#061b31]" href="/mentions-legales">Mentions légales</a>
            </nav>
          </div>
          <p className="mt-5 text-[11px] leading-5 text-[#64748d]">{LEGAL_DISCLAIMER}</p>
        </div>
      </footer>
    </main>
  );
}

function Problem({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#061b31] text-[12px] font-black text-white">
        {number}
      </span>
      <div>
        <h3 className="font-bold text-[#061b31]">{title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#50617a]">{desc}</p>
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
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#eef4f8] text-[#0c8c5e]">
        <Icon aria-hidden className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-bold text-[#061b31]">{title}</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#50617a]">{desc}</p>
      </div>
    </div>
  );
}

function PreviewRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-[13px]">
      <span className="text-[#50617a]">{label}</span>
      <span className={strong ? "font-bold text-[#0c8c5e]" : "font-medium text-[#061b31]"}>{value}</span>
    </div>
  );
}
