export default function ConfidentialitePage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
      <p>
        Modèle à finaliser avec votre conseil juridique. AutoNet traite les données nécessaires au suivi
        cashflow, à la sécurité du compte et à la facturation.
      </p>
      <h2 className="text-xl font-semibold">Données traitées</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Données de compte : email, nom, mot de passe haché, statut de vérification.</li>
        <li>Profil d'entreprise : identité, SIRET/SIREN, adresse, activité, préférences.</li>
        <li>Clients, entrées de chiffre d'affaires, snapshots de réserve et périodes de déclaration.</li>
        <li>Documents générés, rappels et paramètres de notification.</li>
        <li>Facturation et abonnement via Stripe.</li>
      </ul>
      <h2 className="text-xl font-semibold">Droits des utilisateurs</h2>
      <p>
        Vous pouvez demander l'accès, la rectification, l'effacement et la portabilité de vos données. Un export
        JSON et une suppression de compte sont disponibles dans l'espace compte.
      </p>
      <h2 className="text-xl font-semibold">Contact</h2>
      <p>[Email de contact RGPD à compléter]</p>
    </div>
  );
}
