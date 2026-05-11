import { ArrowRight, BadgeEuro, CheckCircle2, Gauge, ShieldCheck, ShoppingBag, WalletCards } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LEGAL_DISCLAIMER } from "@/domain/rules/default-rules";

const modules = [
  ["Cash disponible", "Ce que tu encaisses, ce que tu réserves, ce que tu peux vraiment utiliser."],
  ["Salaire réel", "Transforme ton chiffre d'affaires mensuel en revenu prudent."],
  ["Décision d'achat", "Demande si une dépense, un investissement ou un versement est raisonnable."],
  ["Réserve", "Teste combien de jours tu tiens si les encaissements s'arrêtent."],
  ["Radar seuils", "Vois la marge restante avant TVA, micro et changements de cash disponible."],
  ["Prix minimum", "Calcule le tarif ou le nombre de ventes nécessaires pour ton revenu cible."],
];

const prices = [
  { name: "Free", price: "0 €", items: ["5 encaissements/mois", "disponible basique", "seuils simplifiés", "1 objectif revenu"] },
  { name: "Solo", price: "9 €", items: ["entrées illimitées", "dashboard complet", "salaire réel", "réserve", "documents mensuels"] },
  {
    name: "Pro",
    price: "19 €",
    highlighted: true,
    items: ["je peux acheter ça ?", "prix minimum rentable", "stress test", "scénarios", "exports avancés"],
  },
  { name: "Lifetime bêta", price: "79 €", items: ["100 premiers utilisateurs", "accès Pro bêta", "retours prioritaires", "validation terrain"] },
];

export default function LandingPage() {
  const lifetimeHref = process.env.NEXT_PUBLIC_LIFETIME_PAYMENT_LINK || "/register?offer=lifetime";
  const lifetimeExternal = lifetimeHref.startsWith("http");

  return (
    <main className="bg-white text-[#061b31]">
      <header className="sticky top-0 z-20 border-b border-[#e5edf5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#0c8c5e] text-xs text-white">
              AN
            </span>
            AutoNet
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <a className="hidden text-[#50617a] hover:text-[#061b31] sm:inline" href="/calculateur">
              Calculateur
            </a>
            <a className="hidden text-[#50617a] hover:text-[#061b31] sm:inline" href="#prix">
              Prix
            </a>
            <ButtonLink href="/login" variant="secondary">
              Connexion
            </ButtonLink>
          </nav>
        </div>
      </header>

      <div className="border-b border-[#d8dfe8] bg-[#061b31] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="font-semibold">Lifetime bêta : 100 places à vie pour 79 €.</p>
          <ButtonLink
            className="bg-white text-[#061b31] hover:bg-[#eef4f8]"
            href={lifetimeHref}
            target={lifetimeExternal ? "_blank" : undefined}
          >
            Réserver ma place
          </ButtonLink>
        </div>
      </div>

      <section className="border-b border-[#e5edf5] bg-[#f8fafd]">
        <div className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-[#0c8c5e]">Le cockpit financier de l'indépendant français.</p>
            <h1 className="mt-4 text-4xl font-semibold text-[#061b31] sm:text-5xl">
              Ton compte affiche du chiffre d'affaires. AutoNet te montre ton vrai argent.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#50617a]">
              Saisis ce que tu encaisses. AutoNet te dit quoi mettre de côté, quoi garder, quoi te verser et si une dépense est prudente.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/calculateur">
                Calculer sans inscription
                <ArrowRight aria-hidden className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/register" variant="secondary">
                Créer un compte gratuit
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-[8px] border border-[#d8dfe8] bg-white p-5 shadow-[0_24px_70px_rgba(6,27,49,0.12)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#d8dfe8] pb-4">
              <div>
                <p className="text-sm font-medium text-[#50617a]">Argent vraiment utilisable</p>
                <p className="mt-1 text-4xl font-semibold">1 958 €</p>
              </div>
              <span className="rounded-[6px] bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">Feu vert</span>
            </div>
            <div className="divide-y divide-[#d8dfe8]">
              <PreviewRow label="Tu as encaissé" value="3 200 €" />
              <PreviewRow label="À réserver URSSAF" value="704 €" />
              <PreviewRow label="À réserver impôt" value="128 €" />
              <PreviewRow label="Réserve prudente" value="320 €" />
              <PreviewRow label="Tu peux te verser" value="1 500 €" strong />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <PreviewSignal icon={ShoppingBag} label="MacBook ?" value="Pas ce mois-ci" />
              <PreviewSignal icon={BadgeEuro} label="Salaire cible" value="69 %" />
              <PreviewSignal icon={ShieldCheck} label="Airbag" value="41 jours" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="modules">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold">AutoNet n'est pas une compta simplifiée.</h2>
          <p className="mt-3 text-[#50617a]">C'est un système de décision financière pour savoir quoi faire avec ton argent après chaque encaissement.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(([title, text], index) => (
            <Card key={title}>
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#eef4f8] text-sm font-semibold text-[#061b31]">
                {index + 1}
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#50617a]">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e5edf5] bg-[#f8fafd]" id="prix">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold">Tarifs</h2>
            <p className="mt-2 text-[#50617a]">Gratuit pour tester. Solo pour piloter. Pro pour décider avant de dépenser.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {prices.map((price) => (
              <Card className={price.highlighted ? "border-[#0c8c5e] ring-2 ring-[#0c8c5e]/20" : ""} key={price.name}>
                <h3 className="text-lg font-bold">{price.name}</h3>
                <p className="mt-2 text-3xl font-bold">
                  {price.price}
                  <span className="text-sm font-medium text-[#64748d]">{price.name === "Lifetime bêta" ? " une fois" : "/mois"}</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm text-[#50617a]">
                  {price.items.map((item) => (
                    <li className="flex gap-2" key={item}>
                      <CheckCircle2 aria-hidden className="h-4 w-4 text-[#0c8c5e]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">Chaque euro encaissé reçoit une réponse.</h2>
          <p className="mt-4 text-[#50617a]">
            Combien garder, combien réserver, combien te payer, quand lever le pied, quand augmenter ton tarif.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <WalletCards aria-hidden className="h-6 w-6 text-[#0c8c5e]" />
            <h3 className="mt-4 font-semibold">Disponible</h3>
            <p className="mt-2 text-sm text-[#50617a]">Le cash vraiment à toi.</p>
          </Card>
          <Card>
            <Gauge aria-hidden className="h-6 w-6 text-[#2f6fed]" />
            <h3 className="mt-4 font-semibold">Seuils</h3>
            <p className="mt-2 text-sm text-[#50617a]">Les risques qui changent ton cash.</p>
          </Card>
          <Card>
            <ShieldCheck aria-hidden className="h-6 w-6 text-[#b76e00]" />
            <h3 className="mt-4 font-semibold">Réserve</h3>
            <p className="mt-2 text-sm text-[#50617a]">Ton airbag contre l'irrégularité.</p>
          </Card>
        </div>
      </section>

      <section className="border-t border-[#e5edf5] bg-[#061b31] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Arrête de confondre CA et argent à toi.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#d8dfe8]">{LEGAL_DISCLAIMER}</p>
          </div>
          <ButtonLink className="bg-white text-[#061b31] hover:bg-[#eef4f8]" href="/calculateur">
            Tester le calculateur
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}

function PreviewRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-[#50617a]">{label}</span>
      <span className={strong ? "text-base font-semibold text-[#0c8c5e]" : "font-medium text-[#061b31]"}>{value}</span>
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
      <p className="mt-2 text-xs font-medium text-[#50617a]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
