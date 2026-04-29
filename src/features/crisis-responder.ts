/**
 * MAMA Addiction Recovery — Crisis Responder
 *
 * Immediate crisis detection and MANDATORY SAMHSA/988 handoff.
 * This module prioritizes safety above all else.
 *
 * @module crisis-responder
 * @license GPL-3.0
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const CrisisSeverity = z.enum([
  "active_overdose",
  "suicidal_ideation",
  "active_use_crisis",
  "withdrawal_danger",
  "relapse_in_progress",
  "emotional_crisis",
  "seeking_help",
]);

export const CrisisAssessmentInput = z.object({
  userMessage: z.string().min(1),
  reportedSeverity: CrisisSeverity.optional(),
  location: z
    .object({
      state: z.string().length(2).toUpperCase().optional(),
      zipCode: z.string().optional(),
    })
    .optional(),
  hasNaloxone: z.boolean().optional(),
  isAlone: z.boolean().optional(),
});

export type CrisisAssessmentInput = z.infer<typeof CrisisAssessmentInput>;

export const CrisisResponse = z.object({
  severity: CrisisSeverity,
  immediateAction: z.string(),
  mandatoryHandoff: z.boolean(),
  handoffNumber: z.string(),
  handoffName: z.string(),
  safetyPlan: z.array(z.string()),
  naloxoneInfo: z.string().optional(),
  localResources: z.array(
    z.object({
      name: z.string(),
      phone: z.string(),
      type: z.string(),
    })
  ),
  followUpActions: z.array(z.string()),
  disclaimer: z.string(),
});

export type CrisisResponse = z.infer<typeof CrisisResponse>;

// ---------------------------------------------------------------------------
// Crisis keyword detection
// ---------------------------------------------------------------------------

const OVERDOSE_KEYWORDS = [
  "overdose", "od", "not breathing", "blue lips", "unconscious",
  "passed out", "can't wake", "fentanyl", "too much", "nodding out",
];

const SUICIDAL_KEYWORDS = [
  "kill myself", "want to die", "suicide", "end it", "no reason to live",
  "better off dead", "can't go on", "ending it all",
];

const WITHDRAWAL_DANGER_KEYWORDS = [
  "seizure", "shaking", "can't stop shaking", "hallucinating",
  "alcohol withdrawal", "benzo withdrawal", "dts", "delirium tremens",
];

const RELAPSE_KEYWORDS = [
  "relapse", "used again", "slipped", "fell off", "drinking again",
  "using again", "broke my sobriety", "couldn't resist",
];

/**
 * Detect crisis severity from user message text.
 * SAFETY-CRITICAL: errs on the side of higher severity.
 */
export function detectCrisisSeverity(message: string): z.infer<typeof CrisisSeverity> {
  const lower = message.toLowerCase();

  if (OVERDOSE_KEYWORDS.some((kw) => lower.includes(kw))) return "active_overdose";
  if (SUICIDAL_KEYWORDS.some((kw) => lower.includes(kw))) return "suicidal_ideation";
  if (WITHDRAWAL_DANGER_KEYWORDS.some((kw) => lower.includes(kw))) return "withdrawal_danger";
  if (RELAPSE_KEYWORDS.some((kw) => lower.includes(kw))) return "relapse_in_progress";
  if (lower.includes("crisis") || lower.includes("emergency")) return "active_use_crisis";
  if (lower.includes("help") || lower.includes("treatment") || lower.includes("rehab")) return "seeking_help";

  return "emotional_crisis";
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

const SAMHSA_HOTLINE = "1-800-662-4357";
const SUICIDE_HOTLINE = "988";
const POISON_CONTROL = "1-800-222-1222";

const DISCLAIMER =
  "MANDATORY DISCLAIMER: This is an AI support tool, NOT a medical professional. " +
  "If you or someone you know is in immediate danger, call 911. " +
  `SAMHSA National Helpline: ${SAMHSA_HOTLINE} (24/7, free, confidential). ` +
  `Suicide & Crisis Lifeline: ${SUICIDE_HOTLINE}.`;

/**
 * Assess a crisis situation and return appropriate response with MANDATORY handoff.
 *
 * SAFETY: This function ALWAYS returns a handoff number. For active overdose
 * or suicidal ideation, mandatoryHandoff is always true and cannot be overridden.
 */
export async function assessCrisis(input: CrisisAssessmentInput): Promise<CrisisResponse> {
  const parsed = CrisisAssessmentInput.parse(input);
  const severity = parsed.reportedSeverity ?? detectCrisisSeverity(parsed.userMessage);

  const response = buildCrisisResponse(severity, parsed);
  return CrisisResponse.parse(response);
}

function buildCrisisResponse(
  severity: z.infer<typeof CrisisSeverity>,
  input: CrisisAssessmentInput
): CrisisResponse {
  const base = {
    severity,
    disclaimer: DISCLAIMER,
    localResources: [
      { name: "SAMHSA National Helpline", phone: SAMHSA_HOTLINE, type: "24/7 treatment referral" },
      { name: "988 Suicide & Crisis Lifeline", phone: SUICIDE_HOTLINE, type: "24/7 crisis support" },
      { name: "Crisis Text Line", phone: "Text HOME to 741741", type: "24/7 text-based crisis support" },
    ],
  };

  switch (severity) {
    case "active_overdose":
      return {
        ...base,
        immediateAction: "CALL 911 NOW. If you have naloxone (Narcan), administer it immediately. Turn the person on their side (recovery position). Stay with them.",
        mandatoryHandoff: true,
        handoffNumber: "911",
        handoffName: "Emergency Services",
        safetyPlan: [
          "CALL 911 IMMEDIATELY.",
          "Administer naloxone if available.",
          "Place person on their side (recovery position).",
          "Do NOT leave them alone.",
          "Perform rescue breathing if trained.",
          "Stay on the line with 911.",
        ],
        naloxoneInfo: input.hasNaloxone === false
          ? "Naloxone (Narcan) is available without prescription at most pharmacies. Get some to keep on hand."
          : "Administer naloxone now. One spray in one nostril. If no response in 2-3 minutes, give a second dose.",
        followUpActions: [
          "Good Samaritan laws protect you in most states \u2014 you will NOT get in trouble for calling 911.",
          "After the immediate crisis, connect with SAMHSA: " + SAMHSA_HOTLINE,
        ],
      };

    case "suicidal_ideation":
      return {
        ...base,
        immediateAction: `Please call 988 (Suicide & Crisis Lifeline) right now. You can also text HOME to 741741. You are not alone, and you deserve help.`,
        mandatoryHandoff: true,
        handoffNumber: SUICIDE_HOTLINE,
        handoffName: "988 Suicide & Crisis Lifeline",
        safetyPlan: [
          "Call 988 or text HOME to 741741 right now.",
          "If you are in immediate danger, call 911.",
          "Remove access to means (medications, weapons) if possible.",
          "Stay with someone you trust.",
          "Go to your nearest emergency room if needed.",
        ],
        followUpActions: [
          "You took a brave step reaching out. Keep going.",
          "Call SAMHSA for treatment referral: " + SAMHSA_HOTLINE,
          "Connect with a peer through our Peer Connector module.",
        ],
      };

    case "withdrawal_danger":
      return {
        ...base,
        immediateAction: "Alcohol and benzodiazepine withdrawal can be life-threatening. If experiencing seizures, hallucinations, or severe shaking, call 911 or go to the ER immediately.",
        mandatoryHandoff: true,
        handoffNumber: "911",
        handoffName: "Emergency Services (for severe withdrawal)",
        safetyPlan: [
          "Do NOT attempt to detox alone from alcohol or benzodiazepines.",
          "If having seizures or hallucinations, call 911.",
          "Medical detox is covered by most insurance and Medicaid.",
          "Call SAMHSA to find a medical detox near you: " + SAMHSA_HOTLINE,
        ],
        followUpActions: [
          "Medical detox is the safest way to withdraw \u2014 SAMHSA can help you find one.",
          "Many ERs can start the detox process and refer you.",
        ],
      };

    case "relapse_in_progress":
      return {
        ...base,
        immediateAction: "A relapse is not a failure \u2014 it is a common part of recovery. Right now, the most important thing is your safety.",
        mandatoryHandoff: false,
        handoffNumber: SAMHSA_HOTLINE,
        handoffName: "SAMHSA National Helpline",
        safetyPlan: [
          "Stop using if you can. Your tolerance may be lower than before.",
          "Do NOT use alone. Fentanyl contamination is widespread.",
          "Call someone you trust right now.",
          "If you have naloxone nearby, keep it accessible.",
          "Call SAMHSA: " + SAMHSA_HOTLINE,
        ],
        followUpActions: [
          "Relapse does not erase your progress.",
          "Consider what triggered this and discuss with a counselor.",
          "Use our Sober Coach module for daily check-ins.",
          "Connect with a peer through Peer Connector.",
        ],
      };

    default:
      return {
        ...base,
        immediateAction: `You've reached out, and that takes courage. SAMHSA's free, confidential helpline is available 24/7: ${SAMHSA_HOTLINE}.`,
        mandatoryHandoff: false,
        handoffNumber: SAMHSA_HOTLINE,
        handoffName: "SAMHSA National Helpline",
        safetyPlan: [
          "You are not alone.",
          "Call SAMHSA anytime: " + SAMHSA_HOTLINE,
          "Reach out to someone you trust.",
          "Use our Recovery Navigator to find treatment options.",
        ],
        followUpActions: [
          "Explore treatment options with our Recovery Navigator.",
          "Find a peer mentor through Peer Connector.",
          "Set up daily check-ins with Sober Coach.",
        ],
      };
  }
}
