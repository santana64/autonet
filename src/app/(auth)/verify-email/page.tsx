import Link from "next/link";
import { verifyEmailToken } from "@/actions/auth";
import { ButtonLink } from "@/components/ui/button";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  let message = "Lien de vérification manquant.";
  let success = false;
  if (params?.token) {
    try {
      await verifyEmailToken(params.token);
      message = "Votre email est vérifié.";
      success = true;
    } catch (error) {
      message = error instanceof Error ? error.message : "Lien de vérification invalide.";
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Vérification email</h1>
      <p className={`mt-4 rounded-md p-3 text-sm ${success ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
        {message}
      </p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/app">Ouvrir le cockpit</ButtonLink>
        <Link className="inline-flex items-center text-sm underline" href="/login">
          Connexion
        </Link>
      </div>
    </>
  );
}
