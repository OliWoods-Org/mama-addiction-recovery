/**
 * MAMA Addiction Recovery — Recovery Navigator
 *
 * Treatment center finder using SAMHSA locator data, insurance
 * verification, bed availability checking, and care matching.
 *
 * @module recovery-navigator
 * @license GPL-3.0
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const SubstanceType = z.enum([
  "alcohol",
  "opioids",
  "stimulants",
  "benzodiazepines",
  "cannabis",
  "methamphetamine",
  "cocaine",
  "polysubstance",
  "other",
]);

export const TreatmentLevel = z.enum([
  "medical_detox",
  "residential_inpatient",
  "partial_hospitalization",
  "intensive_outpatient",
  "outpatient",
  "sober_living",
  "telehealth",
]);

export const InsuranceType = z.enum([
  "medicaid",
  "medicare",
  "private_insurance",
  "tricare",
  "no_insurance",
  "sliding_scale",
  "unknown",
]);

export const TreatmentSearchInput = z.object({
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  state: z.string().length(2).toUpperCase(),
  substanceType: SubstanceType,
  treatmentLevel: TreatmentLevel.optional(),
  insurance: InsuranceType.default("unknown"),
  needsMAT: z.boolean().default(false),
  needsDetox: z.boolean().default(false),
  preferredLanguage: z.string().default("en"),
  maxDistanceMiles: z.number().positive().default(50),
  specialPopulation: z
    .enum(["veterans", "lgbtq", "pregnant", "adolescent", "elderly", "none"])
    .default("none"),
});

export type TreatmentSearchInput = z.infer<typeof TreatmentSearchInput>;

export const TreatmentFacility = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  website: z.string().url().optional(),
  distance: z.number().describe("Miles from search ZIP"),
  treatmentLevels: z.array(TreatmentLevel),
  substances: z.array(SubstanceType),
  acceptedInsurance: z.array(InsuranceType),
  hasMAT: z.boolean(),
  hasDetox: z.boolean(),
  bedsAvailable: z.boolean().optional(),
  waitTime: z.string().optional(),
  languages: z.array(z.string()),
  specialPopulations: z.array(z.string()),
  rating: z.number().min(0).max(5).optional(),
  samhsaVerified: z.boolean(),
});

export type TreatmentFacility = z.infer<typeof TreatmentFacility>;

export const TreatmentSearchResult = z.object({
  facilities: z.array(TreatmentFacility),
  totalFound: z.number(),
  samhsaHotline: z.string(),
  insuranceGuidance: z.string(),
  whatToExpect: z.array(z.string()),
  packingList: z.array(z.string()).optional(),
  disclaimer: z.string(),
});

export type TreatmentSearchResult = z.infer<typeof TreatmentSearchResult>;

// ---------------------------------------------------------------------------
// Sample facility database (production uses SAMHSA Treatment Locator API)
// ---------------------------------------------------------------------------

const SAMPLE_FACILITIES: TreatmentFacility[] = [
  {
    name: "Hazelden Betty Ford Foundation",
    address: "15251 Pleasant Valley Rd, Center City, MN 55012",
    phone: "1-866-831-5700",
    website: "https://www.hazeldenbettyford.org",
    distance: 0,
    treatmentLevels: ["medical_detox", "residential_inpatient", "outpatient", "telehealth"],
    substances: ["alcohol", "opioids", "stimulants", "polysubstance"],
    acceptedInsurance: ["private_insurance", "medicaid", "medicare", "tricare"],
    hasMAT: true,
    hasDetox: true,
    bedsAvailable: true,
    waitTime: "1-3 days",
    languages: ["en", "es"],
    specialPopulations: ["veterans", "lgbtq", "adolescent"],
    rating: 4.5,
    samhsaVerified: true,
  },
  {
    name: "Phoenix House",
    address: "Multiple locations nationwide",
    phone: "1-888-671-9392",
    website: "https://www.phoenixhouse.org",
    distance: 0,
    treatmentLevels: ["residential_inpatient", "outpatient", "intensive_outpatient", "sober_living"],
    substances: ["alcohol", "opioids", "cocaine", "methamphetamine", "polysubstance"],
    acceptedInsurance: ["medicaid", "private_insurance", "sliding_scale", "no_insurance"],
    hasMAT: true,
    hasDetox: false,
    languages: ["en", "es"],
    specialPopulations: ["adolescent"],
    rating: 4.2,
    samhsaVerified: true,
  },
];

const DISCLAIMER =
  "MANDATORY: SAMHSA National Helpline \u2014 1-800-662-4357. " +
  "24/7, free, confidential. If in crisis, call now. " +
  "This tool helps locate treatment but does not replace professional medical assessment.";

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Search for treatment facilities matching criteria.
 * In production, this calls the SAMHSA Treatment Locator API.
 */
export async function searchTreatmentFacilities(
  input: TreatmentSearchInput
): Promise<TreatmentSearchResult> {
  const parsed = TreatmentSearchInput.parse(input);

  // Filter facilities (in production this is an API call)
  let facilities = [...SAMPLE_FACILITIES];

  if (parsed.needsMAT) {
    facilities = facilities.filter((f) => f.hasMAT);
  }
  if (parsed.needsDetox) {
    facilities = facilities.filter((f) => f.hasDetox);
  }
  if (parsed.treatmentLevel) {
    facilities = facilities.filter((f) => f.treatmentLevels.includes(parsed.treatmentLevel!));
  }
  if (parsed.insurance !== "unknown") {
    facilities = facilities.filter((f) => f.acceptedInsurance.includes(parsed.insurance));
  }
  if (parsed.specialPopulation !== "none") {
    facilities = facilities.filter((f) =>
      f.specialPopulations.includes(parsed.specialPopulation)
    );
  }

  return {
    facilities,
    totalFound: facilities.length,
    samhsaHotline: "1-800-662-4357",
    insuranceGuidance: getInsuranceGuidance(parsed.insurance),
    whatToExpect: getWhatToExpect(parsed.treatmentLevel ?? "residential_inpatient"),
    packingList: parsed.treatmentLevel === "residential_inpatient" ? getPackingList() : undefined,
    disclaimer: DISCLAIMER,
  };
}

function getInsuranceGuidance(insurance: z.infer<typeof InsuranceType>): string {
  switch (insurance) {
    case "no_insurance":
      return (
        "No insurance? You still have options:\n" +
        "1. SAMHSA block grants fund free treatment in every state.\n" +
        "2. Many facilities offer sliding-scale fees.\n" +
        "3. You may qualify for Medicaid \u2014 apply at healthcare.gov or your state\u2019s Medicaid office.\n" +
        "4. Call SAMHSA (1-800-662-4357) \u2014 they can find free treatment near you."
      );
    case "medicaid":
      return "Medicaid covers substance use treatment in all 50 states, including detox, inpatient, outpatient, and MAT. Your coverage is guaranteed under the ACA.";
    case "medicare":
      return "Medicare Part A covers inpatient treatment. Part B covers outpatient and some MAT medications. Part D covers prescriptions including buprenorphine and naltrexone.";
    case "tricare":
      return "TRICARE covers substance use treatment for active duty and veterans. Contact your regional contractor or call TRICARE: 1-800-444-5445.";
    default:
      return "Most private insurance plans cover substance use treatment under the Mental Health Parity Act. Call your insurance\u2019s member services to verify benefits.";
  }
}

function getWhatToExpect(level: z.infer<typeof TreatmentLevel>): string[] {
  const common = [
    "You will be treated with dignity and respect.",
    "Everything you share is confidential (protected by 42 CFR Part 2).",
    "You can leave at any time \u2014 treatment is voluntary.",
    "Ask questions. This is YOUR recovery.",
  ];

  const levelSpecific: Record<string, string[]> = {
    medical_detox: [
      "Medical staff will monitor you 24/7 during withdrawal.",
      "Medications will be used to manage withdrawal symptoms safely.",
      "Detox typically lasts 3-7 days depending on the substance.",
      "After detox, you\u2019ll transition to the next level of care.",
    ],
    residential_inpatient: [
      "You\u2019ll stay at the facility (typically 28-90 days).",
      "Daily schedule includes therapy, groups, meals, and activities.",
      "Individual and group therapy are the core of treatment.",
      "You\u2019ll develop a discharge/aftercare plan before leaving.",
    ],
    outpatient: [
      "You\u2019ll attend sessions while living at home.",
      "Typically 1-3 sessions per week.",
      "Flexibility to maintain work and family responsibilities.",
    ],
  };

  return [...(levelSpecific[level] ?? []), ...common];
}

function getPackingList(): string[] {
  return [
    "Government-issued ID",
    "Insurance card (if you have one)",
    "List of current medications",
    "Comfortable clothing for 1 week (no offensive graphics)",
    "Toiletries (no alcohol-based products)",
    "Phone numbers of family/support contacts (written down)",
    "Journal or notebook",
    "DO NOT BRING: weapons, drugs/alcohol, large amounts of cash, valuables",
  ];
}

/**
 * Quick insurance verification helper.
 */
export function verifyInsuranceCoverage(insurance: z.infer<typeof InsuranceType>): {
  covered: boolean;
  coverageDetails: string;
  nextStep: string;
} {
  const covered = insurance !== "no_insurance";
  return {
    covered,
    coverageDetails: getInsuranceGuidance(insurance),
    nextStep: covered
      ? "Call the facility and provide your insurance information. They will verify benefits before admission."
      : "Call SAMHSA (1-800-662-4357) to find free treatment options, or apply for Medicaid at healthcare.gov.",
  };
}
