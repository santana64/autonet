import Link from "next/link";
import { forgotPasswordAction } from "@/actions/auth";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/fields";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-slate-600">
        Saisissez votre email. Si le service email est configuré, vous recevrez un lien temporaire.
      </p>
      <ActionForm action={forgotPasswordAction} className="mt-6 space-y-4" submitLabel="Envoyer le lien">
        <Field label="Email" name="email" required type="email" />
      </ActionForm>
      <Link className="mt-5 inline-block text-sm underline" href="/login">
        Retour connexion
      </Link>
    </>
  );
}
