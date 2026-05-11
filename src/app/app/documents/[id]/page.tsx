import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { PrintButton } from "@/components/ui/print-button";
import { formatShortDate } from "@/domain/formatting/format";
import { documentTypeLabels, labelFromMap } from "@/domain/labels";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const document = await prisma.generatedDocument.findFirst({ where: { id, userId: user.id } });
  if (!document) notFound();

  return (
    <>
      <SectionHeader
        action={
          <div className="flex gap-2">
            <PrintButton />
            <ButtonLink href={`/api/documents/${document.id}/html`} variant="secondary">
              Export HTML
            </ButtonLink>
          </div>
        }
        description={`${labelFromMap(documentTypeLabels, document.type)} - généré le ${formatShortDate(document.createdAt)}`}
        title={document.title}
      />
      <Card className="no-print">
        <p className="text-sm text-[#50617a]">
          Prévisualisation du document enregistré. L'export HTML conserve le contenu imprimable et le disclaimer.
        </p>
      </Card>
      <div className="mt-6 overflow-hidden rounded-[8px] border border-[#d8dfe8] bg-white shadow-[0_2px_10px_rgba(6,27,49,0.04)]">
        <iframe className="h-[780px] w-full bg-white" srcDoc={document.contentHtml} title={document.title} />
      </div>
    </>
  );
}
