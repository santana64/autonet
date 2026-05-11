import Link from "next/link";
import { resetPasswordAction } from "@/actions/auth";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/fields";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold">Réinitialiser le mot de passe</h1>
      <ActionForm action={resetPasswordAction} className="mt-6 space-y-4" submitLabel="Mettre à jour">
        <input name="token" type="hidden" value={params?.token ?? ""} />
        <Field label="Nouveau mot de passe" name="password" required type="password" />
      </ActionForm>
      <Link className="mt-5 inline-block text-sm underline" href="/login">
        Retour connexion
      </Link>
    </>
  );
}
