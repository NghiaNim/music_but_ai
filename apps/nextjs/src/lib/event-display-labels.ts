export const GENRE_LABELS: Record<string, string> = {
  orchestral: "Orchestral",
  opera: "Opera",
  chamber: "Chamber",
  solo_recital: "Solo Recital",
  choral: "Choral",
  ballet: "Ballet",
  jazz: "Jazz",
};

/** Long venue names for chips and live-event detail. */
export const VENUE_SOURCE_FULL_NAMES: Record<string, string> = {
  msm: "Manhattan School of Music",
  juilliard: "Juilliard",
  met_opera: "Metropolitan Opera",
  carnegie_hall: "Carnegie Hall",
  ny_phil: "New York Philharmonic",
  nycballet: "New York City Ballet",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner Friendly",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** Street addresses for MSM / Juilliard map links and venue lines. */
export const VENUE_CAMPUS_ADDRESS = {
  msm: "Manhattan School of Music, 130 Claremont Ave, New York, NY 10027",
  juilliard: "The Juilliard School, 155 W 65th St, New York, NY 10023",
} as const;

/** `venueName` values that mean “default hall” (no extra prefix in UI). */
export const VENUE_CAMPUS_DEFAULT_NAME = {
  msm: "Manhattan School of Music",
  juilliard: "The Juilliard School",
} as const;

export const JOURNAL_USER_EVENT_STATUS_BADGE: Record<
  "attended" | "saved",
  string
> = {
  attended:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  saved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};
