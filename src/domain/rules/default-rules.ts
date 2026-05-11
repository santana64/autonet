import { ACTIVITY_CATEGORIES, ActivityCategory } from "@/domain/activity";

export type ContributionRateRule = {
  year: number;
  activityCategory: ActivityCategory;
  label: string;
  socialContributionRate: number;
  trainingContributionRate: number | null;
  taxWithholdingRate: number | null;
  notes: string;
  sourceLabel: string;
  isConfigurable: boolean;
};

export type ThresholdRule = {
  year: number;
  category: ActivityCategory;
  microThresholdCents: number;
  servicePartThresholdCents: number | null;
  vatBaseThresholdCents: number | null;
  vatIncreasedThresholdCents: number | null;
  notes: string;
};

export type RulesConfiguration = {
  year: number;
  legalDisclaimer: string;
  sourceLabels: string[];
  contributionRates: ContributionRateRule[];
  thresholds: ThresholdRule[];
};

export const LEGAL_DISCLAIMER =
  "AutoNet fournit des estimations pour vous aider à anticiper vos cotisations, impôts et seuils. L'outil ne remplace pas l'URSSAF, un expert-comptable, un conseiller fiscal ou les textes officiels. Les montants sont à vérifier selon votre situation.";

const servicePublicSource =
  "Entreprendre Service-Public, fiches micro-entrepreneur et cotisations consultées le 04/05/2026";
const impotsSource =
  "impots.gouv.fr, fiche régimes petites entreprises 2026 consultée le 04/05/2026";

export const DEFAULT_RULES: RulesConfiguration[] = [
  {
    year: 2026,
    legalDisclaimer: LEGAL_DISCLAIMER,
    sourceLabels: [servicePublicSource, impotsSource],
    contributionRates: [
      {
        year: 2026,
        activityCategory: "GOODS_SALES",
        label: "Vente de marchandises",
        socialContributionRate: 0.123,
        trainingContributionRate: 0.001,
        taxWithholdingRate: 0.01,
        notes:
          "Taux de cotisations sociales par défaut pour ventes. La contribution formation et le versement libératoire restent dépendants de la situation.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
      {
        year: 2026,
        activityCategory: "SERVICE_BIC",
        label: "Prestations de services BIC",
        socialContributionRate: 0.212,
        trainingContributionRate: 0.002,
        taxWithholdingRate: 0.017,
        notes: "Taux par défaut pour services BIC, à vérifier selon l'activité exacte.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
      {
        year: 2026,
        activityCategory: "SERVICE_BNC",
        label: "Prestations de services BNC",
        socialContributionRate: 0.256,
        trainingContributionRate: 0.002,
        taxWithholdingRate: 0.022,
        notes:
          "Règle prudente alignée sur la profession libérale non réglementée 2026. À adapter si un taux spécifique s'applique.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
      {
        year: 2026,
        activityCategory: "LIBERAL_CIPAV",
        label: "Profession libérale réglementée CIPAV",
        socialContributionRate: 0.232,
        trainingContributionRate: 0.002,
        taxWithholdingRate: 0.022,
        notes: "Taux CIPAV par défaut. Certaines professions peuvent relever d'une règle spécifique.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
      {
        year: 2026,
        activityCategory: "LIBERAL_GENERAL",
        label: "Profession libérale non réglementée",
        socialContributionRate: 0.256,
        trainingContributionRate: 0.002,
        taxWithholdingRate: 0.022,
        notes: "Taux par défaut pour profession libérale générale en 2026.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
      {
        year: 2026,
        activityCategory: "CRAFT_SERVICE",
        label: "Service artisanal",
        socialContributionRate: 0.212,
        trainingContributionRate: 0.003,
        taxWithholdingRate: 0.017,
        notes:
          "Taux de services par défaut avec contribution formation artisanale indicative et configurable.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
      {
        year: 2026,
        activityCategory: "MIXED",
        label: "Activité mixte",
        socialContributionRate: 0.212,
        trainingContributionRate: 0.002,
        taxWithholdingRate: null,
        notes:
          "Une activité mixte doit être ventilée par catégorie. Cette règle sert uniquement de filet de sécurité.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
      {
        year: 2026,
        activityCategory: "ACCOMMODATION_CLASSIFIED",
        label: "Hébergement classé",
        socialContributionRate: 0.06,
        trainingContributionRate: 0.001,
        taxWithholdingRate: 0.01,
        notes: "Taux par défaut pour meublé de tourisme classé, à vérifier selon la situation.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
      {
        year: 2026,
        activityCategory: "ACCOMMODATION_UNCLASSIFIED",
        label: "Meublé touristique non classé",
        socialContributionRate: 0.212,
        trainingContributionRate: 0.001,
        taxWithholdingRate: 0.017,
        notes:
          "Les meublés touristiques non classés peuvent être soumis à des seuils et règles spécifiques plus restrictifs.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
      {
        year: 2026,
        activityCategory: "OTHER",
        label: "Autre activité",
        socialContributionRate: 0.256,
        trainingContributionRate: null,
        taxWithholdingRate: null,
        notes: "Règle conservatrice à remplacer par la règle applicable à l'activité réelle.",
        sourceLabel: servicePublicSource,
        isConfigurable: true,
      },
    ],
    thresholds: [
      threshold("GOODS_SALES", 203_100_00, null, 85_000_00, 93_500_00),
      threshold("SERVICE_BIC", 83_600_00, null, 37_500_00, 41_250_00),
      threshold("SERVICE_BNC", 83_600_00, null, 37_500_00, 41_250_00),
      threshold("LIBERAL_CIPAV", 83_600_00, null, 37_500_00, 41_250_00),
      threshold("LIBERAL_GENERAL", 83_600_00, null, 37_500_00, 41_250_00),
      threshold("CRAFT_SERVICE", 83_600_00, null, 37_500_00, 41_250_00),
      threshold("MIXED", 203_100_00, 83_600_00, 85_000_00, 93_500_00),
      threshold("ACCOMMODATION_CLASSIFIED", 203_100_00, null, 85_000_00, 93_500_00),
      threshold(
        "ACCOMMODATION_UNCLASSIFIED",
        15_000_00,
        null,
        37_500_00,
        41_250_00,
        "Seuil micro spécifique potentiellement inférieur pour certains meublés touristiques non classés : règle à vérifier avant décision."
      ),
      threshold("OTHER", 83_600_00, null, 37_500_00, 41_250_00),
    ],
  },
];

function threshold(
  category: ActivityCategory,
  microThresholdCents: number,
  servicePartThresholdCents: number | null,
  vatBaseThresholdCents: number | null,
  vatIncreasedThresholdCents: number | null,
  extraNotes = ""
): ThresholdRule {
  return {
    year: 2026,
    category,
    microThresholdCents,
    servicePartThresholdCents,
    vatBaseThresholdCents,
    vatIncreasedThresholdCents,
    notes: [
      "Seuils configurables. Les seuils TVA sont décorrélés du régime micro et doivent être vérifiés selon l'activité, la date de création et les options.",
      extraNotes,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export function getRulesForYear(year: number) {
  return DEFAULT_RULES.find((rules) => rules.year === year) ?? DEFAULT_RULES[0];
}

export function getContributionRate(activityCategory: ActivityCategory, year = 2026) {
  const rules = getRulesForYear(year);
  return (
    rules.contributionRates.find((rule) => rule.activityCategory === activityCategory) ??
    rules.contributionRates.find((rule) => rule.activityCategory === "OTHER")!
  );
}

export function getThresholdRule(activityCategory: ActivityCategory, year = 2026) {
  const rules = getRulesForYear(year);
  return (
    rules.thresholds.find((rule) => rule.category === activityCategory) ??
    rules.thresholds.find((rule) => rule.category === "OTHER")!
  );
}

export function validateRulesConfiguration(rules: RulesConfiguration) {
  const errors: string[] = [];
  if (!rules.year || rules.year < 2020) errors.push("L'année des règles est invalide.");

  for (const category of ACTIVITY_CATEGORIES) {
    const rate = rules.contributionRates.find((rule) => rule.activityCategory === category);
    const thresholdRule = rules.thresholds.find((rule) => rule.category === category);

    if (!rate) errors.push(`Taux manquant pour ${category}.`);
    if (!thresholdRule) errors.push(`Seuil manquant pour ${category}.`);
    if (rate && (rate.socialContributionRate < 0 || rate.socialContributionRate > 1)) {
      errors.push(`Taux social invalide pour ${category}.`);
    }
    if (thresholdRule && thresholdRule.microThresholdCents <= 0) {
      errors.push(`Seuil micro invalide pour ${category}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
