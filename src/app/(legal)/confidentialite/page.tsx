export default function ConfidentialitePage() {
  return (
    <div>
      <h1>Politique de confidentialité</h1>
      <p>Dernière mise à jour : mai 2026.</p>

      <h2>Responsable du traitement</h2>
      <p>
        Auto-entrepreneur opérant sous le nom commercial AutoNet — contact :{" "}
        <a href="mailto:piesse917@gmail.com">piesse917@gmail.com</a>
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li><strong>Compte :</strong> email, nom, mot de passe haché (bcrypt), statut de vérification email.</li>
        <li><strong>Profil entreprise :</strong> activité, fréquence de déclaration, régime TVA, SIRET (optionnel).</li>
        <li><strong>Données financières :</strong> encaissements saisis, réserve, snapshots de déclaration, documents générés.</li>
        <li><strong>Facturation :</strong> ID client et abonnement Stripe (AutoNet ne stocke aucune carte bancaire).</li>
        <li><strong>Leads calculateur :</strong> adresse email saisie volontairement pour recevoir le guide.</li>
        <li><strong>Technique :</strong> sessions, logs d'accès anonymisés, cookies de session (httpOnly, sécurisé).</li>
      </ul>

      <h2>Finalités</h2>
      <ul>
        <li>Fourniture du service de suivi financier.</li>
        <li>Envoi des emails transactionnels (vérification, réinitialisation, rappels déclarations).</li>
        <li>Gestion des abonnements et de la facturation via Stripe.</li>
        <li>Envoi du guide cotisations AE aux leads ayant renseigné leur email volontairement.</li>
      </ul>

      <h2>Conservation des données</h2>
      <p>
        Les données de compte sont conservées tant que le compte est actif. Après suppression du compte, les
        données sont effacées sous 30 jours. Les données de facturation sont conservées 10 ans conformément à
        la réglementation fiscale.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité
        et d'opposition. Un export JSON de toutes vos données et une suppression de compte sont disponibles
        directement dans votre espace compte. Pour toute demande : <a href="mailto:piesse917@gmail.com">piesse917@gmail.com</a>
      </p>

      <h2>Hébergement</h2>
      <p>
        Application hébergée sur Vercel (USA, avec edge en Europe). Base de données sur Neon — infrastructure
        AWS EU-West Frankfurt. Emails transactionnels via Resend. Paiements via Stripe.
      </p>
    </div>
  );
}
