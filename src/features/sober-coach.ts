/**
 * MAMA Addiction Recovery — Sober Coach
 *
 * AI-powered daily check-ins, trigger identification, coping strategy
 * library, milestone tracking, and relapse early-warning system.
 *
 * @module sober-coach
 * @license GPL-3.0
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const MoodLevel = z.enum(["great", "good", "okay", "struggling", "crisis"]);

export const DailyCheckInInput = z.object({
  userId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: MoodLevel,
  cravingLevel: z.number().int().min(0).max(10),
  sleptWell: z.boolean(),
  exercised: z.boolean(),
  attendedMeeting: z.boolean(),
  contactedSponsor: z.boolean(),
  triggers: z.array(z.string()).default([]),
  gratitude: z.string().optional(),
  notes: z.string().optional(),
});

export type DailyCheckInInput = z.infer<typeof DailyCheckInInput>;

export const CopingStrategy = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["physical", "mental", "social", "spiritual", "practical"]),
  description: z.string(),
  timeNeeded: z.string(),
  effectiveness: z.enum(["high", "moderate", "situational"]),
  forTriggers: z.array(z.string()),
});

export type CopingStrategy = z.infer<typeof CopingStrategy>;

export const CheckInResult = z.object({
  sobrietyDays: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  riskLevel: z.enum(["low", "moderate", "elevated", "high"]),
  suggestedStrategies: z.array(CopingStrategy),
  affirmation: z.string(),
  milestone: z.string().optional(),
  warningSignals: z.array(z.string()),
  samhsaReminder: z.string(),
});

export type CheckInResult = z.infer<typeof CheckInResult>;

// ---------------------------------------------------------------------------
// Coping strategies library
// ---------------------------------------------------------------------------

const STRATEGIES: CopingStrategy[] = [
  {
    id: "breathe-box",
    name: "Box Breathing",
    category: "physical",
    description: "Breathe in 4 counts, hold 4, out 4, hold 4. Repeat 4 times. Activates parasympathetic nervous system.",
    timeNeeded: "2 minutes",
    effectiveness: "high",
    forTriggers: ["stress", "anxiety", "craving", "anger"],
  },
  {
    id: "urge-surf",
    name: "Urge Surfing",
    category: "mental",
    description: "Observe the craving like a wave \u2014 it rises, peaks, and falls. Don\u2019t fight it, just watch. Most cravings pass in 15-30 minutes.",
    timeNeeded: "15-30 minutes",
    effectiveness: "high",
    forTriggers: ["craving", "boredom", "loneliness"],
  },
  {
    id: "call-someone",
    name: "Call Your Person",
    category: "social",
    description: "Call your sponsor, sober friend, or anyone in your support network. You don\u2019t have to be in crisis \u2014 just connect.",
    timeNeeded: "5-30 minutes",
    effectiveness: "high",
    forTriggers: ["loneliness", "isolation", "craving", "depression"],
  },
  {
    id: "halt-check",
    name: "H.A.L.T. Check",
    category: "practical",
    description: "Am I Hungry, Angry, Lonely, or Tired? Address the basic need first. Most cravings have a simpler root cause.",
    timeNeeded: "1 minute",
    effectiveness: "high",
    forTriggers: ["craving", "irritability", "restlessness"],
  },
  {
    id: "cold-water",
    name: "Cold Water Reset",
    category: "physical",
    description: "Splash cold water on your face or hold ice cubes. The cold activates the dive reflex and resets your nervous system.",
    timeNeeded: "1 minute",
    effectiveness: "moderate",
    forTriggers: ["panic", "craving", "overwhelming_emotion"],
  },
  {
    id: "play-the-tape",
    name: "Play the Tape Forward",
    category: "mental",
    description: "Imagine in detail what happens AFTER you use. Not the first drink/hit \u2014 the morning after. The shame. The spiral. Is it worth it?",
    timeNeeded: "5 minutes",
    effectiveness: "high",
    forTriggers: ["craving", "romanticizing_use", "nostalgia"],
  },
  {
    id: "move-body",
    name: "Move Your Body",
    category: "physical",
    description: "Walk, run, do pushups, dance \u2014 anything. Physical movement releases endorphins and interrupts craving circuits.",
    timeNeeded: "10-30 minutes",
    effectiveness: "high",
    forTriggers: ["craving", "anxiety", "restlessness", "boredom"],
  },
  {
    id: "gratitude-list",
    name: "Gratitude List",
    category: "spiritual",
    description: "Write 5 things you\u2019re grateful for right now. Include things your sober self made possible.",
    timeNeeded: "5 minutes",
    effectiveness: "moderate",
    forTriggers: ["depression", "self_pity", "hopelessness"],
  },
  {
    id: "meeting-now",
    name: "Find a Meeting Right Now",
    category: "social",
    description: "AA, NA, SMART Recovery \u2014 there\u2019s a meeting happening right now, either in person or online.",
    timeNeeded: "1 hour",
    effectiveness: "high",
    forTriggers: ["craving", "loneliness", "isolation", "relapse_thoughts"],
  },
  {
    id: "safe-place",
    name: "Go to Your Safe Place",
    category: "practical",
    description: "Physically remove yourself from the triggering environment. Go somewhere where using is not possible: library, gym, friend\u2019s house, meeting.",
    timeNeeded: "varies",
    effectiveness: "high",
    forTriggers: ["environment_trigger", "people_trigger", "craving"],
  },
];

// ---------------------------------------------------------------------------
// Milestone definitions
// ---------------------------------------------------------------------------

const MILESTONES: { days: number; name: string; message: string }[] = [
  { days: 1, name: "Day One", message: "The hardest step is the first. You did it." },
  { days: 7, name: "One Week", message: "One week. Your body is already healing." },
  { days: 14, name: "Two Weeks", message: "Two weeks. Sleep is improving. Clarity is coming back." },
  { days: 30, name: "One Month", message: "30 days. This is a BIG deal. Your brain chemistry is resetting." },
  { days: 60, name: "Two Months", message: "60 days. You\u2019re building a new life. Keep going." },
  { days: 90, name: "90 Days", message: "90 days \u2014 the gold standard. You\u2019re proving it\u2019s possible." },
  { days: 180, name: "Six Months", message: "Half a year of freedom. You are not the same person you were." },
  { days: 365, name: "One Year", message: "ONE YEAR. You did the impossible. Celebrate this." },
  { days: 730, name: "Two Years", message: "Two years. You\u2019re not just surviving \u2014 you\u2019re thriving." },
  { days: 1825, name: "Five Years", message: "Five years. You are living proof that recovery works." },
];

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Process a daily check-in and return personalized response.
 */
export async function processDailyCheckIn(
  input: DailyCheckInInput,
  sobrietyStartDate: string
): Promise<CheckInResult> {
  const parsed = DailyCheckInInput.parse(input);

  const startDate = new Date(sobrietyStartDate);
  const checkInDate = new Date(parsed.date);
  const sobrietyDays = Math.floor(
    (checkInDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const riskLevel = assessRiskLevel(parsed);
  const suggestedStrategies = matchStrategies(parsed);
  const milestone = checkMilestone(sobrietyDays);
  const warningSignals = detectWarningSignals(parsed);

  return {
    sobrietyDays,
    currentStreak: sobrietyDays,
    riskLevel,
    suggestedStrategies,
    affirmation: getAffirmation(parsed.mood, sobrietyDays),
    milestone: milestone?.message,
    warningSignals,
    samhsaReminder: "SAMHSA: 1-800-662-4357 | 988 for crisis | Always here, always free.",
  };
}

function assessRiskLevel(input: DailyCheckInInput): "low" | "moderate" | "elevated" | "high" {
  let score = 0;

  if (input.mood === "crisis") score += 4;
  else if (input.mood === "struggling") score += 2;

  score += Math.floor(input.cravingLevel / 3);

  if (!input.sleptWell) score += 1;
  if (!input.attendedMeeting && !input.contactedSponsor) score += 1;
  if (input.triggers.length > 2) score += 1;

  if (score >= 6) return "high";
  if (score >= 4) return "elevated";
  if (score >= 2) return "moderate";
  return "low";
}

function matchStrategies(input: DailyCheckInInput): CopingStrategy[] {
  const triggers = new Set(input.triggers.map((t) => t.toLowerCase()));

  if (input.mood === "crisis" || input.cravingLevel >= 8) {
    // High urgency: return top immediate strategies
    return STRATEGIES.filter((s) =>
      ["call-someone", "safe-place", "meeting-now", "breathe-box"].includes(s.id)
    );
  }

  // Match by triggers
  const matched = STRATEGIES.filter((s) =>
    s.forTriggers.some((ft) => triggers.has(ft))
  );

  if (matched.length > 0) return matched.slice(0, 4);

  // Default strategies based on mood
  if (input.mood === "struggling") {
    return STRATEGIES.filter((s) => s.effectiveness === "high").slice(0, 3);
  }

  return [STRATEGIES[7]]; // gratitude list for good days
}

function checkMilestone(days: number): { name: string; message: string } | undefined {
  return MILESTONES.find((m) => m.days === days);
}

function detectWarningSignals(input: DailyCheckInInput): string[] {
  const warnings: string[] = [];

  if (input.cravingLevel >= 7) {
    warnings.push("High craving level detected. Consider reaching out to your sponsor or calling SAMHSA.");
  }
  if (!input.sleptWell && input.mood === "struggling") {
    warnings.push("Poor sleep + low mood is a common relapse precursor. Prioritize rest and connection today.");
  }
  if (!input.attendedMeeting && !input.contactedSponsor && input.cravingLevel >= 5) {
    warnings.push("You haven\u2019t connected with your support network today. Isolation + cravings = risk. Call someone.");
  }
  if (input.triggers.length > 3) {
    warnings.push("Multiple triggers active. Consider changing your environment or attending a meeting.");
  }

  return warnings;
}

function getAffirmation(mood: z.infer<typeof MoodLevel>, days: number): string {
  if (mood === "great" || mood === "good") {
    return `Day ${days}. You\u2019re doing this. Every sober day is a victory.`;
  }
  if (mood === "okay") {
    return `Day ${days}. \u201COkay\u201D is enough. You showed up. That\u2019s what matters.`;
  }
  if (mood === "struggling") {
    return `Day ${days}. Struggling doesn\u2019t mean failing. You\u2019re still here. That\u2019s strength.`;
  }
  return `Day ${days}. You reached out. That is the bravest thing you can do. Call SAMHSA: 1-800-662-4357.`;
}
