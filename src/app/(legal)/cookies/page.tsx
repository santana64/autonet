export default function CookiesPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Cookies</h1>
      <p>
        AutoNet utilise au minimum un cookie de session strictement nécessaire pour maintenir la connexion
        sécurisée. Aucun cookie publicitaire n'est requis dans cette version.
      </p>
      <h2 className="text-xl font-semibold">Cookie nécessaire</h2>
      <p>
        Le cookie <code>autonet_session</code> contient un jeton opaque stocké en base sous forme hachée. Il
        expire automatiquement et peut être supprimé lors de la déconnexion.
      </p>
      <h2 className="text-xl font-semibold">Évolutions</h2>
      <p>
        Si des outils de mesure d'audience ou de support client sont ajoutés, cette page devra être mise à jour
        avec les finalités, durées et options de consentement.
      </p>
    </div>
  );
}
