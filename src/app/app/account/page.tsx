import { deleteAccountAction, changePasswordAction, updateAccountAction } from "@/actions/account";
import { resendVerificationDirectAction } from "@/actions/auth";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/fields";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { formatShortDate } from "@/domain/formatting/format";
import { requireUser } from "@/lib/auth";

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  return (
    <>
      <SectionHeader description="Compte, sécurité, export et suppression des données." title="Compte" />
      {params?.notice ? <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{params.notice}</p> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Informations</h2>
          <ActionForm action={updateAccountAction} className="mt-4 space-y-4" submitLabel="Mettre à jour">
            <Field label="Nom" name="name" defaultValue={user.name} />
            <Field label="Email" name="email" defaultValue={user.email} required type="email" />
          </ActionForm>
          <div className="mt-5 rounded-md bg-slate-50 p-3 text-sm">
            <p>Vérification email : {user.emailVerifiedAt ? `vérifié le ${formatShortDate(user.emailVerifiedAt)}` : "non vérifié"}</p>
            {!user.emailVerifiedAt ? (
              <form action={resendVerificationDirectAction} className="mt-3">
                <Button type="submit" variant="secondary">Renvoyer la vérification</Button>
              </form>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Changer le mot de passe</h2>
          <ActionForm action={changePasswordAction} className="mt-4 space-y-4" submitLabel="Changer le mot de passe">
            <Field label="Mot de passe actuel" name="currentPassword" required type="password" />
            <Field label="Nouveau mot de passe" name="newPassword" required type="password" />
          </ActionForm>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Export de données</h2>
          <p className="mt-2 text-sm text-slate-600">
            Téléchargez un export JSON incluant compte, profil, clients, revenus, déclarations, documents et abonnement.
          </p>
          <ButtonLink className="mt-4" href="/api/account/export" variant="secondary">
            Exporter mes données
          </ButtonLink>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-red-800">Suppression du compte</h2>
          <p className="mt-2 text-sm text-slate-600">
            Cette action supprime le compte et les données associées. Tapez SUPPRIMER pour confirmer.
          </p>
          <form action={deleteAccountAction} className="mt-4 space-y-3">
            <input className="w-full rounded-md border border-red-300 px-3 py-2 text-sm" name="confirmation" placeholder="SUPPRIMER" />
            <Button type="submit" variant="danger">Supprimer mon compte</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
