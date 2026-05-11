import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/fields";

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Créer mon cockpit</h1>
      <p className="mt-2 text-sm text-slate-600">
        Commencez avec le suivi de votre chiffre d'affaires encaissé et les seuils à surveiller.
      </p>
      <ActionForm action={registerAction} className="mt-6 space-y-4" submitLabel="Créer mon compte">
        <Field label="Nom" name="name" />
        <Field label="Email" name="email" required type="email" />
        <Field label="Mot de passe" name="password" required type="password" help="10 caractéres minimum." />
      </ActionForm>
      <p className="mt-5 text-sm text-slate-600">
        Déjé inscrit ?{" "}
        <Link className="underline" href="/login">
          Connexion
        </Link>
      </p>
    </>
  );
}
