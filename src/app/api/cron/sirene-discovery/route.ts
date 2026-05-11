import { prisma } from "@/lib/prisma";

// Queries that find auto-entrepreneurs likely to need AutoNet
const QUERIES = [
  "développeur web freelance",
  "développeur freelance",
  "consultant informatique",
  "graphiste freelance",
  "consultant indépendant",
  "formateur indépendant",
  "rédacteur freelance",
  "photographe freelance",
  "coach indépendant",
  "traducteur freelance",
];

type SireneResult = {
  siege?: { siret?: string; libelle_commune?: string };
  nom_complet?: string;
  activite_principale?: string;
  date_creation?: string;
  dirigeants?: Array<{ prenoms?: string; nom?: string }>;
};

export async function GET(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let discovered = 0;
  let skipped = 0;

  // Pick 3 random queries to avoid hammering the API
  const queries = QUERIES.sort(() => Math.random() - 0.5).slice(0, 3);

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&nature_juridique=1000,10&tranche_effectif_salarie=NN&per_page=25`,
        { next: { revalidate: 0 } }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const results: SireneResult[] = data.results ?? [];

      for (const e of results) {
        const siret = e.siege?.siret;
        if (!siret) continue;

        // Check if already in prospect list by siret
        const exists = await prisma.prospect.findFirst({ where: { siret } });
        if (exists) { skipped++; continue; }

        const dirigeant = e.dirigeants?.[0];
        const firstName = dirigeant?.prenoms?.split(" ")[0] ?? undefined;
        const lastName = dirigeant?.nom ?? undefined;

        try {
          await prisma.prospect.create({
            data: {
              email: `__siret_${siret}@pending.local`,
              firstName,
              lastName,
              siret,
              activity: e.activite_principale ?? q,
              city: e.siege?.libelle_commune ?? undefined,
              source: "sirene",
              status: "new",
            },
          });
          discovered++;
        } catch { skipped++; }
      }
    } catch { /* continue */ }
  }

  return Response.json({ discovered, skipped, queries });
}
