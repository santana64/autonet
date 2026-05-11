import { updateBusinessProfileAction } from "@/actions/business";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Select, TextArea, activityOptions } from "@/components/forms/fields";
import { Card, SectionHeader } from "@/components/ui/card";
import { ACTIVITY_CATEGORIES, activityLabels } from "@/domain/activity";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await prisma.businessProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const enabledCategories = new Set(profile.activityCategories);

  return (
    <>
      <SectionHeader
        description="Ces réglages pilotent l'affectation des périodes, les taux de prévision et les avertissements de seuil."
        title="Réglages entreprise"
      />
      <Card>
        <ActionForm action={updateBusinessProfileAction} submitLabel="Enregistrer les réglages">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom commercial" name="businessName" defaultValue={profile.businessName} />
            <Field label="Nom du titulaire" name="ownerName" defaultValue={profile.ownerName} />
            <Field label="SIRET" name="siret" defaultValue={profile.siret} />
            <Field label="SIREN" name="siren" defaultValue={profile.siren} />
            <Field label="Email entreprise" name="email" type="email" defaultValue={profile.email} />
            <Field label="Téléphone" name="phone" defaultValue={profile.phone} />
            <Field label="Adresse" name="address" defaultValue={profile.address} />
            <Field label="Code postal" name="postalCode" defaultValue={profile.postalCode} />
            <Field label="Ville" name="city" defaultValue={profile.city} />
            <Select label="Activité principale" name="mainActivityCategory" defaultValue={profile.mainActivityCategory} options={activityOptions} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[#061b31]">Activités exercées</p>
            <div className="grid gap-2 md:grid-cols-2">
              {ACTIVITY_CATEGORIES.map((category) => (
                <label className="flex items-center gap-2 rounded-[6px] border border-[#d8dfe8] p-3 text-sm text-[#061b31]" key={category}>
                  <input defaultChecked={enabledCategories.has(category)} name={`activity_${category}`} type="checkbox" />
                  {activityLabels[category]}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Select
              defaultValue={profile.declarationFrequency}
              label="Fréquence déclaration"
              name="declarationFrequency"
              options={[
                { label: "Mensuelle", value: "MONTHLY" },
                { label: "Trimestrielle", value: "QUARTERLY" },
              ]}
            />
            <Select
              defaultValue={profile.vatStatus}
              label="TVA / franchise"
              name="vatStatus"
              options={[
                { label: "Franchise en base", value: "FRANCHISE_BASE" },
                { label: "Redevable TVA", value: "VAT_LIABLE" },
                { label: "Inconnu / à surveiller", value: "UNKNOWN" },
              ]}
            />
            <Field label="Année des règles" name="contributionRulesYear" type="number" defaultValue={profile.contributionRulesYear} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2 rounded-[6px] border border-[#d8dfe8] p-3 text-sm text-[#061b31]">
              <input defaultChecked={profile.mixedActivityEnabled} name="mixedActivityEnabled" type="checkbox" />
              Activité mixte
            </label>
            <label className="flex items-center gap-2 rounded-[6px] border border-[#d8dfe8] p-3 text-sm text-[#061b31]">
              <input defaultChecked={profile.taxWithholdingEnabled} name="taxWithholdingEnabled" type="checkbox" />
              Versement libératoire
            </label>
            <label className="flex items-center gap-2 rounded-[6px] border border-[#d8dfe8] p-3 text-sm text-[#061b31]">
              <input defaultChecked={profile.reminderEmailEnabled} name="reminderEmailEnabled" type="checkbox" />
              Rappels email
            </label>
          </div>

          <Field
            defaultValue={String(profile.conservativeReserveBufferRate ?? "0.05")}
            help="Exemple : 0.30 pour garder une marge de 30 % autour de la provision."
            label="Taux de réserve par défaut"
            max="1"
            min="0"
            name="conservativeReserveBufferRate"
            step="0.01"
            type="number"
          />
          <TextArea label="Pied de document" name="documentFooterText" defaultValue={profile.documentFooterText} />
          <TextArea label="Signature par défaut" name="defaultSignature" defaultValue={profile.defaultSignature} />
        </ActionForm>
      </Card>
    </>
  );
}
