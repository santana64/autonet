import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { generatePeriodsAction, updateDeclarationStatusAction } from "@/actions/declarations";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { formatMoney, formatShortDate } from "@/domain/formatting/format";
import { declarationStatusLabels, labelFromMap } from "@/domain/labels";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  year?: string;
};

export default async function DeclarationsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const year = parseYear(params.year, new Date().getFullYear());
  const periods = await prisma.declarationPeriod.findMany({
    where: { userId: user.id, year },
    orderBy: [{ startDate: "asc" }],
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <>
      <SectionHeader
        action={
          <div className="flex flex-wrap gap-2">
            <YearLink direction="prev" year={year - 1} />
            <YearLink direction="next" year={year + 1} />
            <form action={generatePeriodsAction}>
              <input name="year" type="hidden" value={year} />
              <Button type="submit" variant="secondary">
                Générer {year}
              </Button>
            </form>
          </div>
        }
        description="Périodes mensuelles ou trimestrielles selon vos réglages. Chaque période a sa synthèse estimative."
        title={`Déclarations ${year}`}
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[#64748d]">
              <tr>
                <th className="py-2">Période</th>
                <th>Dates</th>
                <th>Échéance</th>
                <th>CA encaissé</th>
                <th>Estimation due</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => {
                const snapshot = period.snapshots[0];
                return (
                  <tr className="border-t border-[#eef4f8]" key={period.id}>
                    <td className="py-3 font-medium">{period.label}</td>
                    <td>
                      {formatShortDate(period.startDate)} - {formatShortDate(period.endDate)}
                    </td>
                    <td>{formatShortDate(period.dueDate)}</td>
                    <td>{formatMoney(snapshot?.totalRevenueCents ?? 0)}</td>
                    <td>{formatMoney(snapshot?.estimatedTotalDueCents ?? 0)}</td>
                    <td>
                      <Badge tone={statusTone(period.status)}>
                        {labelFromMap(declarationStatusLabels, period.status)}
                      </Badge>
                    </td>
                    <td className="flex justify-end gap-2 py-2">
                      <Link className="rounded-[6px] px-3 py-2 text-sm underline" href={`/app/declarations/${period.id}`}>
                        Ouvrir
                      </Link>
                      {period.status === "OPEN" ? (
                        <form action={updateDeclarationStatusAction}>
                          <input name="id" type="hidden" value={period.id} />
                          <input name="status" type="hidden" value="READY" />
                          <Button type="submit" variant="ghost">
                            Prête
                          </Button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {!periods.length ? (
                <tr>
                  <td className="py-8 text-center text-[#64748d]" colSpan={7}>
                    Aucune période générée pour {year}. Utilisez le bouton de génération.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function YearLink({ direction, year }: { direction: "prev" | "next"; year: number }) {
  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-[#d8dfe8] bg-white px-4 py-2 text-sm font-semibold text-[#061b31] hover:bg-[#f8fafd]"
      href={`/app/declarations?year=${year}`}
    >
      {direction === "prev" ? <ArrowLeft aria-hidden className="h-4 w-4" /> : null}
      {year}
      {direction === "next" ? <ArrowRight aria-hidden className="h-4 w-4" /> : null}
    </Link>
  );
}

function parseYear(value: string | undefined, fallback: number) {
  const year = Number.parseInt(value ?? "", 10);
  if (Number.isFinite(year) && year >= 2020 && year <= 2035) return year;
  return fallback;
}
