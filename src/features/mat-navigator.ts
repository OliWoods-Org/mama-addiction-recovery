/**
 * MAMA Addiction Recovery — MAT Navigator
 *
 * Medication-Assisted Treatment guidance: Suboxone, methadone,
 * naltrexone provider finder. Insurance coverage. Stigma-free information.
 *
 * @module mat-navigator
 * @license GPL-3.0
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const MATMedication = z.enum([
  "buprenorphine_suboxone",
  "methadone",
  "naltrexone_vivitrol",
  "naloxone_narcan",
  "disulfiram_antabuse",
  "acamprosate",
  "unsure",
]);

export const MATSearchInput = z.object({
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  state: z.string().length(2).toUpperCase(),
  medication: MATMedication,
  insurance: z.enum(["medicaid", "medicare", "private", "none", "unknown"]).default("unknown"),
  substance: z.enum(["opioids", "alcohol", "both"]),
  maxDistanceMiles: z.number().positive().default(50),
});

export type MATSearchInput = z.infer<typeof MATSearchInput>;

export const MATProvider = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  website: z.string().url().optional(),
  medications: z.array(MATMedication),
  acceptsInsurance: z.array(z.string()),
  telehealth: z.boolean(),
  walkIn: z.boolean(),
  waitTime: z.string().optional(),
  distance: z.number().optional(),
});

export type MATProvider = z.infer<typeof MATProvider>;

export const MedicationInfo = z.object({
  name: z.string(),
  genericName: z.string(),
  howItWorks: z.string(),
  effectiveness: z.string(),
  sideEffects: z.array(z.string()),
  duration: z.string(),
  myths: z.array(z.object({ myth: z.string(), fact: z.string() })),
  cost: z.string(),
  insuranceCoverage: z.string(),
});

export type MedicationInfo = z.infer<typeof MedicationInfo>;

export const MATSearchResult = z.object({
  providers: z.array(MATProvider),
  medicationInfo: MedicationInfo,
  keyMessage: z.string(),
  samhsaHotline: z.string(),
  disclaimer: z.string(),
});

export type MATSearchResult = z.infer<typeof MATSearchResult>;

// ---------------------------------------------------------------------------
// Medication information database
// ---------------------------------------------------------------------------

const MEDICATION_DB: Record<string, MedicationInfo> = {
  buprenorphine_suboxone: {
    name: "Suboxone (Buprenorphine/Naloxone)",
    genericName: "buprenorphine/naloxone sublingual film",
    howItWorks:
      "Buprenorphine is a partial opioid agonist \u2014 it activates opioid receptors enough to prevent withdrawal and cravings, but not enough to produce a high. Naloxone is added to discourage misuse.",
    effectiveness:
      "Reduces opioid use by 50-80%. Cuts overdose death risk by 50%. One of the most effective treatments for opioid use disorder, backed by decades of research.",
    sideEffects: [
      "Headache (common, usually temporary)",
      "Nausea (first few days)",
      "Constipation",
      "Insomnia or drowsiness",
      "Sweating",
    ],
    duration: "Typically 12-24 months minimum. Many people stay on it long-term \u2014 this is medically appropriate.",
    cost: "$100-500/month without insurance. Most insurance and Medicaid cover it.",
    insuranceCoverage: "Covered by Medicaid in all 50 states. Covered by Medicare Part D. Most private insurance covers it under the Mental Health Parity Act.",
    myths: [
      {
        myth: "Suboxone just replaces one addiction with another.",
        fact: "Suboxone is TREATMENT, not substitution. Like insulin for diabetes, it corrects a brain chemistry imbalance. Taking prescribed medication is not addiction.",
      },
      {
        myth: "You\u2019re not really sober if you\u2019re on Suboxone.",
        fact: "Sobriety means living free from the chaos of active addiction. MAT enables people to work, parent, and live normal lives. That IS sobriety.",
      },
      {
        myth: "You should taper off as quickly as possible.",
        fact: "Rapid tapers increase relapse and overdose risk. There is NO medical reason to rush. Duration should be decided by you and your doctor.",
      },
    ],
  },
  methadone: {
    name: "Methadone",
    genericName: "methadone hydrochloride",
    howItWorks:
      "Methadone is a full opioid agonist that acts slowly, preventing withdrawal and cravings for 24-36 hours without producing euphoria at stable doses.",
    effectiveness:
      "Reduces opioid use by 60-90%. Reduces overdose death by 50-70%. The longest-studied and most evidence-based treatment for opioid use disorder.",
    sideEffects: [
      "Drowsiness (usually resolves after stabilization)",
      "Constipation",
      "Sweating",
      "Weight gain",
      "Decreased libido",
    ],
    duration: "Minimum 12 months recommended. Many people benefit from long-term or indefinite maintenance.",
    cost: "$5-25/day at a clinic. Medicaid covers it in all states.",
    insuranceCoverage: "Covered by Medicaid everywhere. Medicare coverage varies. Private insurance increasingly covers it.",
    myths: [
      {
        myth: "Methadone clinics are just legal drug dealing.",
        fact: "Methadone clinics are licensed healthcare facilities with medical staff, counseling, and wraparound services. They save lives.",
      },
      {
        myth: "Methadone is more dangerous than heroin.",
        fact: "Under medical supervision, methadone is safe and effective. It has been used for 50+ years with extensive safety data.",
      },
    ],
  },
  naltrexone_vivitrol: {
    name: "Vivitrol (Naltrexone)",
    genericName: "naltrexone extended-release injectable",
    howItWorks:
      "Naltrexone is an opioid antagonist \u2014 it blocks opioid receptors completely. If you use opioids or drink alcohol while on naltrexone, you won\u2019t feel the effects.",
    effectiveness:
      "Reduces heavy drinking days by 25%. Reduces opioid relapse by 50% vs placebo. Works best for people already through detox and highly motivated.",
    sideEffects: [
      "Injection site reaction (pain, hardness)",
      "Nausea (usually first few days)",
      "Headache",
      "Fatigue",
      "Decreased appetite",
    ],
    duration: "Monthly injection. Typically 6-12 months, but can continue indefinitely.",
    cost: "$1,000-1,500/month (injection). Insurance usually covers it.",
    insuranceCoverage: "Covered by most insurance, Medicaid, and Medicare. Manufacturer offers patient assistance programs.",
    myths: [
      {
        myth: "Naltrexone is only for alcoholism.",
        fact: "Vivitrol is FDA-approved for BOTH opioid use disorder and alcohol use disorder.",
      },
    ],
  },
};

const DISCLAIMER =
  "MANDATORY: SAMHSA National Helpline \u2014 1-800-662-4357 (24/7, free, confidential). " +
  "MAT saves lives. This information does not replace consultation with a healthcare provider. " +
  "MAT is real recovery. Period.";

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Search for MAT providers and return medication information.
 */
export async function searchMATProviders(input: MATSearchInput): Promise<MATSearchResult> {
  const parsed = MATSearchInput.parse(input);

  const medKey = parsed.medication === "unsure" ? "buprenorphine_suboxone" : parsed.medication;
  const medInfo = MEDICATION_DB[medKey];

  if (!medInfo) {
    return {
      providers: [],
      medicationInfo: {
        name: parsed.medication.replace(/_/g, " "),
        genericName: "See your doctor",
        howItWorks: "Consult a healthcare provider for detailed medication information.",
        effectiveness: "Proven effective in clinical studies.",
        sideEffects: ["Consult prescribing information"],
        duration: "As prescribed by your doctor",
        cost: "Varies",
        insuranceCoverage: "Contact your insurance provider.",
        myths: [],
      },
      keyMessage: "MAT saves lives. Talk to your doctor about which medication is right for you.",
      samhsaHotline: "1-800-662-4357",
      disclaimer: DISCLAIMER,
    };
  }

  // In production, this queries SAMHSA buprenorphine practitioner locator
  const sampleProviders: MATProvider[] = [
    {
      name: `MAT Provider near ${parsed.zipCode}`,
      address: `[Use SAMHSA locator for ${parsed.state} providers]`,
      phone: "1-800-662-4357",
      medications: [parsed.medication === "unsure" ? "buprenorphine_suboxone" : parsed.medication],
      acceptsInsurance: ["medicaid", "medicare", "private"],
      telehealth: true,
      walkIn: false,
      waitTime: "1-7 days typically",
    },
  ];

  return {
    providers: sampleProviders,
    medicationInfo: medInfo,
    keyMessage:
      "MAT is the gold standard for opioid use disorder treatment. " +
      "It reduces overdose deaths by 50%. It is REAL recovery. " +
      "Anyone who tells you otherwise is putting lives at risk.",
    samhsaHotline: "1-800-662-4357",
    disclaimer: DISCLAIMER,
  };
}

/**
 * Get stigma-busting facts about MAT.
 */
export function getMATFacts(): string[] {
  return [
    "MAT reduces all-cause mortality by 50% in people with opioid use disorder.",
    "The World Health Organization lists buprenorphine and methadone as Essential Medicines.",
    "MAT is endorsed by SAMHSA, NIH, CDC, WHO, AMA, and every major medical organization.",
    "People on MAT can work, drive, parent, and live completely normal lives.",
    "There is NO medical evidence that tapering off MAT improves outcomes \u2014 forced tapers increase death.",
    "MAT + counseling is more effective than either alone.",
    "Denying MAT to someone with opioid use disorder is like denying insulin to someone with diabetes.",
    "The \u201Cabstinence only\u201D approach has a 90%+ relapse rate for opioid use disorder. MAT cuts that dramatically.",
  ];
}
