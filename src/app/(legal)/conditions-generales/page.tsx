export default function ConditionsGeneralesPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Conditions générales</h1>
      <p>
        Modèle de conditions générales à relire et adapter avant exploitation commerciale. Les pages tarifaires
        et Stripe font foi pour les prix réellement proposés.
      </p>
      <h2 className="text-xl font-semibold">Objet</h2>
      <p>
        AutoNet fournit un service SaaS de suivi du chiffre d'affaires encaissé, d'estimation de réserve,
        de calcul de disponible prudent, de surveillance de seuils et de génération de synthèses.
      </p>
      <h2 className="text-xl font-semibold">Responsabilité</h2>
      <p>
        Les calculs sont des estimations à vérifier selon la situation de l'utilisateur. Le service ne soumet
        aucune déclaration officielle et ne garantit pas l'exactitude administrative ou fiscale.
      </p>
      <h2 className="text-xl font-semibold">Abonnements</h2>
      <p>
        Les abonnements Starter, Pro et Cabinet sont gérés via Stripe. Les limites d'offre sont appliquées côté
        serveur afin d'éviter les usages non autorisés.
      </p>
    </div>
  );
}
