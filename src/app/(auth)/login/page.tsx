import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/fields";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="mt-2 text-sm text-slate-600">Retrouvez votre cockpit de décision financière.</p>
      <ActionForm action={loginAction} className="mt-6 space-y-4" submitLabel="Se connecter">
        <input name="next" type="hidden" value={params?.next ?? "/app"} />
        <Field autoComplete="email" inputMode="email" label="Email" name="email" required type="text" />
        <Field autoComplete="current-password" label="Mot de passe" name="password" required type="password" />
      </ActionForm>
      <div className="mt-5 flex justify-between text-sm">
        <Link className="text-slate-700 underline" href="/forgot-password">
          Mot de passe oublié
        </Link>
        <Link className="text-slate-700 underline" href="/register">
          Créer un compte
        </Link>
      </div>
    </>
  );
}
