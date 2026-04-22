/**
 * MAMA Addiction Recovery — Peer Connector
 *
 * Recovery mentor matching, AA/NA/SMART Recovery meeting finder,
 * and community connection tools.
 *
 * @module peer-connector
 * @license GPL-3.0
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const MeetingType = z.enum([
  "aa",
  "na",
  "smart_recovery",
  "refuge_recovery",
  "celebrate_recovery",
  "al_anon",
  "nar_anon",
  "online_any",
]);

export const MeetingFormat = z.enum([
  "in_person",
  "online_video",
  "online_phone",
  "hybrid",
]);

export const MeetingSearchInput = z.object({
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  meetingType: MeetingType,
  format: MeetingFormat.optional(),
  dayOfWeek: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]).optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "late_night"]).optional(),
  language: z.string().default("en"),
  specialFocus: z
    .enum(["women_only", "men_only", "lgbtq", "young_people", "beginners", "none"])
    .default("none"),
  maxDistanceMiles: z.number().positive().default(25),
});

export type MeetingSearchInput = z.infer<typeof MeetingSearchInput>;

export const Meeting = z.object({
  name: z.string(),
  type: MeetingType,
  format: MeetingFormat,
  address: z.string().optional(),
  onlineLink: z.string().url().optional(),
  dayTime: z.string(),
  specialFocus: z.string().optional(),
  language: z.string(),
  notes: z.string().optional(),
  distance: z.number().optional(),
});

export type Meeting = z.infer<typeof Meeting>;

export const PeerMentorProfile = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  sobrietyYears: z.number(),
  substance: z.string(),
  bio: z.string(),
  availability: z.array(z.string()),
  languages: z.array(z.string()),
  specialExperience: z.array(z.string()),
  verified: z.boolean(),
});

export type PeerMentorProfile = z.infer<typeof PeerMentorProfile>;

export const PeerConnectionResult = z.object({
  meetings: z.array(Meeting),
  onlineMeetings: z.array(Meeting),
  mentors: z.array(PeerMentorProfile),
  communityMessage: z.string(),
  hotlines: z.array(z.object({ name: z.string(), phone: z.string() })),
  disclaimer: z.string(),
});

export type PeerConnectionResult = z.infer<typeof PeerConnectionResult>;

// ---------------------------------------------------------------------------
// Online meeting resources (always available)
// ---------------------------------------------------------------------------

const ONLINE_MEETINGS: Meeting[] = [
  {
    name: "AA Online Intergroup",
    type: "aa",
    format: "online_video",
    onlineLink: "https://aa-intergroup.org/meetings/",
    dayTime: "24/7 \u2014 meetings every hour worldwide",
    language: "en",
    notes: "Thousands of online meetings in dozens of languages. A meeting is always happening.",
  },
  {
    name: "NA Virtual Meetings",
    type: "na",
    format: "online_video",
    onlineLink: "https://virtual-na.org/meetings/",
    dayTime: "24/7 \u2014 continuous worldwide",
    language: "en",
    notes: "Virtual NA meetings running around the clock.",
  },
  {
    name: "SMART Recovery Online",
    type: "smart_recovery",
    format: "online_video",
    onlineLink: "https://www.smartrecovery.org/community/",
    dayTime: "Multiple daily meetings",
    language: "en",
    notes: "Science-based alternative to 12-step. No higher-power requirement.",
  },
  {
    name: "In The Rooms",
    type: "online_any",
    format: "online_video",
    onlineLink: "https://www.intherooms.com",
    dayTime: "24/7",
    language: "en",
    notes: "130+ weekly online meetings across all recovery fellowships. Free.",
  },
  {
    name: "Al-Anon Family Groups Online",
    type: "al_anon",
    format: "online_video",
    onlineLink: "https://al-anon.org/al-anon-meetings/electronic-meetings/",
    dayTime: "Multiple daily meetings",
    language: "en",
    notes: "For family members and friends of people with alcohol problems.",
  },
];

const DISCLAIMER =
  "MANDATORY: SAMHSA National Helpline \u2014 1-800-662-4357 (24/7, free, confidential). " +
  "Peer support supplements but does not replace professional treatment.";

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Search for recovery meetings by location and preferences.
 */
export async function findMeetings(input: MeetingSearchInput): Promise<PeerConnectionResult> {
  const parsed = MeetingSearchInput.parse(input);

  // In production, this calls meeting finder APIs (AA, NA, SMART Recovery)
  const onlineMeetings = ONLINE_MEETINGS.filter(
    (m) => parsed.meetingType === "online_any" || m.type === parsed.meetingType || m.type === "online_any"
  );

  // Sample in-person meeting (production would geocode + search)
  const localMeetings: Meeting[] = [
    {
      name: `${parsed.meetingType.toUpperCase().replace("_", " ")} Meeting near ${parsed.zipCode}`,
      type: parsed.meetingType as any,
      format: "in_person",
      address: `[Use meeting finder to locate exact address near ${parsed.zipCode}]`,
      dayTime: "Check local schedule",
      language: parsed.language,
      notes: "Visit the fellowship\u2019s meeting finder for exact locations and times.",
    },
  ];

  return {
    meetings: localMeetings,
    onlineMeetings,
    mentors: [], // Populated in production from peer mentor database
    communityMessage:
      "You don\u2019t have to do this alone. Every person in recovery was once where you are now. " +
      "A meeting is happening right now, somewhere in the world, and there\u2019s a seat for you.",
    hotlines: [
      { name: "SAMHSA Helpline", phone: "1-800-662-4357" },
      { name: "988 Crisis Lifeline", phone: "988" },
      { name: "Crisis Text Line", phone: "Text HOME to 741741" },
    ],
    disclaimer: DISCLAIMER,
  };
}

/**
 * Get meeting finder URLs for each fellowship.
 */
export function getMeetingFinderLinks(): Record<string, string> {
  return {
    aa: "https://www.aa.org/find-aa",
    na: "https://www.na.org/meetingsearch/",
    smart_recovery: "https://www.smartrecovery.org/community/",
    refuge_recovery: "https://www.refugerecovery.org/meetings",
    celebrate_recovery: "https://www.celebraterecovery.com/finder",
    al_anon: "https://al-anon.org/al-anon-meetings/find-an-al-anon-meeting/",
    nar_anon: "https://www.nar-anon.org/find-a-meeting",
    in_the_rooms: "https://www.intherooms.com",
  };
}

/**
 * Generate a "first meeting" guide for someone nervous about attending.
 */
export function getFirstMeetingGuide(meetingType: z.infer<typeof MeetingType>): string[] {
  const common = [
    "You do NOT have to speak. Listening is perfectly fine.",
    "There are no dues or fees. A basket may be passed \u2014 contributing is optional.",
    "Everything shared in meetings is confidential.",
    "Arrive a few minutes early. Introduce yourself to one person.",
    "If asked, you can simply say: \u201CI\u2019m [name] and I\u2019m just here to listen.\u201D",
    "There is no dress code. Come as you are.",
    "You do not need to be sober to attend. Come as you are.",
    "If the first meeting doesn\u2019t feel right, try a different one. Every meeting has its own personality.",
  ];

  if (meetingType === "aa" || meetingType === "na") {
    common.push(
      "12-step meetings use the concept of a \u201CHigher Power\u201D \u2014 this does NOT have to be religious. " +
        "Many people use the group itself, nature, or their own values as their Higher Power."
    );
  }

  if (meetingType === "smart_recovery") {
    common.push(
      "SMART Recovery is science-based and does not use the 12 steps or a Higher Power concept. " +
        "It focuses on self-empowerment and evidence-based tools."
    );
  }

  return common;
}
