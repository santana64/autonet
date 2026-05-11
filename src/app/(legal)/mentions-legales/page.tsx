export default function MentionsLegalesPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Mentions légales</h1>
      <p>
        Cette page est un modèle éditable. Les informations d'éditeur doivent être complétées avant mise en
        production : raison sociale, forme juridique, capital, RCS, adresse, directeur de publication et contact.
      </p>
      <h2 className="text-xl font-semibold">Éditeur</h2>
      <p>[Nom de la société] - [Adresse complète] - [Email de contact] - [Numéro d'identification].</p>
      <h2 className="text-xl font-semibold">Hébergement</h2>
      <p>[Nom de l'hébergeur] - [Adresse] - [Contact].</p>
      <h2 className="text-xl font-semibold">Nature du service</h2>
      <p>
        AutoNet est un outil d'aide à l'estimation du cash disponible et au suivi administratif léger pour
        micro-entrepreneurs. Il ne remplace pas l'URSSAF, un expert-comptable, un conseiller fiscal ou les textes
        officiels.
      </p>
    </div>
  );
}
