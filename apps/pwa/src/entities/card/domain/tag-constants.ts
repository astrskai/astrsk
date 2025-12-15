/**
 * Default predefined tags for cards (characters and scenarios)
 * These tags are shown as toggleable buttons in the tag selection UI
 */
export const TAG_DEFAULT: readonly string[] = [
  "Female",
  "Male",
  "Villain",
  "Fictional",
  "OC",
  "LGBTQA+",
  "Platonic",
  "Angst",
  "Fluff",
  "Historical",
  "Royalty",
] as const;

export type DefaultTag = (typeof TAG_DEFAULT)[number];

/**
 * Genre suggestions for quick scenario creation
 * Used in the home page for quick session creation
 */
export const GENRE_SUGGESTIONS: readonly string[] = [
  "Fantasy",
  "SciFi",
  "Cyberpunk",
  "Mystery",
  "Horror",
  "Romance",
  "SliceOfLife",
  "Historical",
  "Survival",
  "Steampunk",
  "Dystopian",
  "Pirates",
  "Kingdom",
  "Western",
  "Zombies",
] as const;

export type GenreSuggestion = (typeof GENRE_SUGGESTIONS)[number];
