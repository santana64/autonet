import Link from "next/link";
import { deleteDocumentAction, generateDocumentDirectAction } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { planAllows } from "@/domain/billing/plans";
import { formatShortDate } from "@/domain/formatting/format";
import { documentTypeLabels, labelFromMap } from "@/domain/labels";
import { requireUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const documentTypes = [
  ["MONTHLY_CASH_SUMMARY", "Synthèse cash mensuelle"],
  ["ANNUAL_REVENUE_SUMMARY", "Synthèse annuelle"],
  ["THRESHOLD_RADAR_REPORT", "Radar de seuils"],
  ["ACCOUNTANT_EXPORT", "Pack expert-comptable"],
] as const;

export default async function DocumentsPage() {
  const user = await requireUser();
  const [documents, plan] = await Promise.all([
    prisma.generatedDocument.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    getUserPlan(user.id),
  ]);
  const canExport = planAllows(plan, "documentExport");
  const canAccountant = planAllows(plan, "accountantExport");

  return (
    <>
      <SectionHeader
        description="Documents secondaires : cash mensuel, déclaration, seuils et pack expert-comptable."
        title="Documents"
      />
      <Card>
        <h2 className="text-lg font-semibold">Générer un document</h2>
        {canExport ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {documentTypes.map(([type, label]) => {
              if (type === "ACCOUNTANT_EXPORT" && !canAccountant) return null;
              return (
                <form action={generateDocumentDirectAction} key={type}>
                  <input name="type" type="hidden" value={type} />
                  <Button type="submit" variant="secondary">{label}</Button>
                </form>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-[6px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Votre offre actuelle ne permet pas la génération de documents. Passez à Solo ou Pro.
          </p>
        )}
      </Card>

      <Card className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[#64748d]">
              <tr><th className="py-2">Document</th><th>Type</th><th>Créé le</th><th></th></tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr className="border-t border-[#eef4f8]" key={document.id}>
                  <td className="py-3 font-medium">{document.title}</td>
                  <td>{labelFromMap(documentTypeLabels, document.type)}</td>
                  <td>{formatShortDate(document.createdAt)}</td>
                  <td className="flex justify-end gap-2">
                    <Link className="rounded-[6px] px-3 py-2 underline" href={`/app/documents/${document.id}`}>
                      Prévisualiser
                    </Link>
                    <form action={deleteDocumentAction}>
                      <input name="id" type="hidden" value={document.id} />
                      <Button type="submit" variant="ghost">Supprimer</Button>
                    </form>
                  </td>
                </tr>
              ))}
              {!documents.length ? (
                <tr><td className="py-8 text-center text-[#64748d]" colSpan={4}>Aucun document généré.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
